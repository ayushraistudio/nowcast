import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

def train_xgboost_model():
    input_filename = "labeled_weather_data.csv"
    model_filename = "xgboost_model.json"

    print(f"Loading labeled data from {input_filename}...")
    df = pd.read_csv(input_filename)

    # We use temperature, humidity, and pressure as features to predict the risk
    # Note: In a production SIH app, we would add more features like CAPE and Lifted Index
    features = ['temperature', 'humidity', 'pressure']
    X = df[features]
    y = df['target']

    # Split the dataset into training (80%) and testing (20%) sets
    print("Splitting data into training and testing sets...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # Calculate weight for the imbalanced classes (Negative samples / Positive samples)
    negative_cases = len(y_train[y_train == 0])
    positive_cases = len(y_train[y_train == 1])
    scale_weight = negative_cases / positive_cases if positive_cases > 0 else 1.0

    print(f"Training XGBoost model (scale_pos_weight={scale_weight:.2f})...")
    
    # Initialize the XGBoost Classifier
    model = xgb.XGBClassifier(
        objective='binary:logistic',
        scale_pos_weight=scale_weight,
        eval_metric='auc',
        max_depth=5,
        learning_rate=0.05,
        n_estimators=150,
        random_state=42
    )

    # Train the model
    model.fit(X_train, y_train)

    print("Evaluating model performance on test data...")
    y_pred = model.predict(X_test)
    
    # Print evaluation metrics
    print("\n--- Confusion Matrix ---")
    print(confusion_matrix(y_test, y_pred))
    
    print("\n--- Classification Report ---")
    print(classification_report(y_test, y_pred, target_names=['Clear (0)', 'Risk (1)']))

    # Save the trained model to be used by the FastAPI backend
    model.save_model(model_filename)
    print(f"\nModel successfully saved to {model_filename}")

if __name__ == "__main__":
    train_xgboost_model()