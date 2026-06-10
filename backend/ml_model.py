import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from xgboost import XGBClassifier
import shap
import pickle
import os

MODEL_PATH = "model.pkl"
FEATURES_PATH = "features.pkl"

def train_model(dataset_path: str):
    # 1. Load data
    df = pd.read_csv(dataset_path)
    
    # 2. Preprocessing
    # Drop columns not used for training
    X = df.drop(columns=['nim', 'is_on_time'])
    y = df['is_on_time']
    
    # Categorical encoding (One-Hot Encoding)
    X = pd.get_dummies(X, columns=['gender', 'major', 'financial_status'], drop_first=True)
    
    # Save feature names to ensure order in prediction
    feature_names = X.columns.tolist()
    with open(FEATURES_PATH, 'wb') as f:
        pickle.dump(feature_names, f)
        
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 3. Training
    model = XGBClassifier(use_label_encoder=False, eval_metric='logloss')
    model.fit(X_train, y_train)
    
    # 4. Evaluation
    y_pred = model.predict(X_test)
    metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred), 4),
        "recall": round(recall_score(y_test, y_pred), 4),
        "f1_score": round(f1_score(y_test, y_pred), 4)
    }
    
    # 5. Save Model
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
        
    return metrics

def predict_and_explain(input_data: dict):
    # input_data is a dictionary with raw features
    if not os.path.exists(MODEL_PATH) or not os.path.exists(FEATURES_PATH):
        raise FileNotFoundError("Model or Features not found. Please train first.")
        
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
        
    with open(FEATURES_PATH, 'rb') as f:
        feature_names = pickle.load(f)
        
    df = pd.DataFrame([input_data])
    
    # Preprocess same as training
    # Note: For production, a robust pipeline (like sklearn.pipeline) is recommended
    df = pd.get_dummies(df, columns=['gender', 'major', 'financial_status'])
    
    # Align features
    X_input = pd.DataFrame(columns=feature_names)
    X_input = pd.concat([X_input, df], axis=0).fillna(0)
    X_input = X_input[feature_names] # ensure correct order
    X_input = X_input.astype(float) # xgboost requires numeric
    
    # Predict
    probability = model.predict_proba(X_input)[0][1]
    prediction = int(model.predict(X_input)[0])
    
    # SHAP Explainability
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_input)
    
    # Format SHAP values for JSON response
    # TreeExplainer for xgboost binary classification returns an array of shape (n_samples, n_features)
    if isinstance(shap_values, list):
        shap_values = shap_values[1] # some versions return list for class 0 and 1
    
    shap_dict = {}
    for i, feature in enumerate(feature_names):
        shap_dict[feature] = round(float(shap_values[0][i]), 4)
        
    # Sort by absolute SHAP value to find top risk factors
    sorted_factors = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)
    top_factors = [{"feature": k, "impact": v} for k, v in sorted_factors[:5]]
    
    return {
        "prediction": prediction,
        "probability_on_time": round(float(probability), 4),
        "risk_factors": top_factors
    }

if __name__ == "__main__":
    # Test
    metrics = train_model("data/students_dataset.csv")
    print("Metrics:", metrics)
