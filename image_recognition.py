# Import required libraries
import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input, decode_predictions

# Download and prepare the pre-trained model
model = MobileNetV2(weights='imagenet')

# Function to load and preprocess the image
def prepare_image(img_path):
    # Load image and resize to 224x224 (required input size for MobileNetV2)
    img = image.load_img(img_path, target_size=(224, 224))

    # Convert image to array
    img_array = image.img_to_array(img)

    # Expand dimensions to create batch
    img_array = np.expand_dims(img_array, axis=0)

    # Preprocess input
    img_array = preprocess_input(img_array)

    return img_array

# Code to run inference
"""
# Example usage:
from google.colab import files
uploaded = files.upload()  # This will prompt for file upload

# Get the filename of the uploaded image
image_path = next(iter(uploaded))

# Prepare the image
processed_image = prepare_image(image_path)

# Make predictions
predictions = model.predict(processed_image)

# Decode and print the top 5 predictions
results = decode_predictions(predictions, top=5)[0]
for result in results:
    print(f"{result[1]}: {result[2]*100:.2f}%")
"""
