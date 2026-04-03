from ultralytics import YOLO

# Load once (global)
model = YOLO("yolov8n.pt")

# Relevant cheating objects
TARGET_CLASSES = {
    67: "cell phone",
    63: "laptop",
}

def detect_objects(frame):
    results = model(frame, verbose=False)
    detected = []

    for result in results:
        for box in result.boxes:
            cls_id = int(box.cls[0])

            if cls_id in TARGET_CLASSES:
                detected.append(TARGET_CLASSES[cls_id])

    return detected
