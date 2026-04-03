from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import base64
import os
import numpy as np
from io import BytesIO
from PIL import Image

app = Flask(__name__)
CORS(app)  # Allow React frontend

REGISTERED_DIR = "registered_faces"
os.makedirs(REGISTERED_DIR, exist_ok=True)


# ------------------ Helper Function ------------------

def base64_to_image(base64_str):
    try:
        # Remove data:image/...;base64,
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]

        img_bytes = base64.b64decode(base64_str)
        image = Image.open(BytesIO(img_bytes)).convert("RGB")
        image = image.resize((640, 480))
        return np.array(image)

    except Exception as e:
        print("Decode error:", e)
        return None


# ------------------ Register Face ------------------

@app.route("/register_face", methods=["POST"])
def register_face():
    data = request.json
    student_id = data.get("student_id")
    image_b64 = data.get("image")

    if not student_id or not image_b64:
        return jsonify({"status": "fail", "message": "Missing student_id or image"}), 400

    image = base64_to_image(image_b64)
    if image is None:
        return jsonify({"status": "fail", "message": "Invalid image"}), 400

    # Save received image for debugging
    Image.fromarray(image).save("debug_register.png")

    face_locations = face_recognition.face_locations(image, model="hog")

    if len(face_locations) == 0:
        return jsonify({"status": "fail", "message": "No face detected"}), 400

    face_encoding = face_recognition.face_encodings(image, face_locations)[0]

    np.save(f"{REGISTERED_DIR}/{student_id}_embedding.npy", face_encoding)
    Image.fromarray(image).save(f"{REGISTERED_DIR}/{student_id}.png")

    return jsonify({"status": "success", "message": "Face registered successfully"})


# ------------------ Verify Face ------------------

@app.route("/verify_face", methods=["POST"])
def verify_face():
    data = request.json
    student_id = data.get("student_id")
    image_b64 = data.get("image")

    if not student_id or not image_b64:
        return jsonify({"status": "fail", "message": "Missing student_id or image"}), 400

    image = base64_to_image(image_b64)
    if image is None:
        return jsonify({"status": "fail", "message": "Invalid image"}), 400

    Image.fromarray(image).save("debug_verify.png")

    face_locations = face_recognition.face_locations(image, model="hog")

    if len(face_locations) == 0:
        return jsonify({"status": "fail", "message": "No face detected"}), 400

    face_encoding = face_recognition.face_encodings(image, face_locations)[0]

    embedding_path = f"{REGISTERED_DIR}/{student_id}_embedding.npy"

    if not os.path.exists(embedding_path):
        return jsonify({"status": "fail", "message": "No registered face found"}), 400

    known_embedding = np.load(embedding_path)

    results = face_recognition.compare_faces(
        [known_embedding], face_encoding, tolerance=0.5
    )

    if results[0]:
        return jsonify({"status": "success", "message": "Face verified"})
    else:
        return jsonify({"status": "fail", "message": "Face mismatch"}), 400


# ------------------ Run Server ------------------

if __name__ == "__main__":
    print("✅ Face API running at http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
