import pandas as pd
import numpy as np
import random
import os

def generate_mock_data(num_records=500):
    np.random.seed(42)
    random.seed(42)

    data = []
    for i in range(num_records):
        nim = f"1301{20+random.randint(0,4)}{random.randint(1000, 9999)}"
        gender = random.choice(['L', 'P'])
        major = random.choice(['Teknik Informatika', 'Sistem Informasi', 'Teknik Komputer'])
        
        # Features that influence graduation
        gpa = np.clip(np.random.normal(3.1, 0.4), 2.0, 4.0)
        attendance_rate = np.clip(np.random.normal(85, 10), 50, 100)
        extracurricular_score = np.clip(np.random.normal(60, 20), 0, 100)
        financial_status = random.choice(['Mandiri', 'Beasiswa', 'KIP-K'])
        
        # SKS progress (Assuming evaluation at semester 6)
        semester = 6
        credits_completed = int(np.clip(np.random.normal(110, 15), 60, 144))
        
        # Logic for target variable (is_on_time)
        # Higher GPA, Credits, and Attendance increase chance of on-time graduation
        score = (gpa * 20) + (attendance_rate * 0.3) + (credits_completed * 0.2)
        
        if financial_status == 'Beasiswa':
            score += 5
            
        probability = 1 / (1 + np.exp(-(score - 105) / 5)) # Sigmoid function
        is_on_time = 1 if random.random() < probability else 0

        data.append({
            'nim': nim,
            'gender': gender,
            'major': major,
            'semester': semester,
            'gpa': round(gpa, 2),
            'credits_completed': credits_completed,
            'attendance_rate': round(attendance_rate, 2),
            'extracurricular_score': int(extracurricular_score),
            'financial_status': financial_status,
            'is_on_time': is_on_time
        })

    df = pd.DataFrame(data)
    
    # Save to CSV
    os.makedirs('data', exist_ok=True)
    df.to_csv('data/students_dataset.csv', index=False)
    print(f"Dataset generated successfully at 'data/students_dataset.csv' with {num_records} records.")

if __name__ == "__main__":
    generate_mock_data(1000)
