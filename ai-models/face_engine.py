import torch
import cv2
from PIL import Image
from facenet_pytorch import MTCNN, InceptionResnetV1
from scipy.spatial.distance import cosine

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

mtcnn = MTCNN(keep_all=False, device=device)
resnet = InceptionResnetV1(pretrained='vggface2').eval().to(device)


def encode_image(img):
    if img is None:
        return None

    # Convert OpenCV BGR → RGB
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Convert to PIL Image (IMPORTANT)
    pil_img = Image.fromarray(rgb)
    print("pil_img", pil_img)
    face = mtcnn(pil_img)
    if face is None:
        return None

    face = face.unsqueeze(0).to(device)
    embedding = resnet(face)

    return embedding.detach().cpu().numpy()[0]


def compare_faces(known_encoding, frame, threshold=0.5):
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(rgb)

    face = mtcnn(pil_img)
    if face is None:
        return False

    face = face.unsqueeze(0).to(device)
    embedding = resnet(face)

    embedding = embedding.detach().cpu().numpy()[0]

    similarity = 1 - cosine(known_encoding, embedding)

    return similarity > (1 - threshold)
