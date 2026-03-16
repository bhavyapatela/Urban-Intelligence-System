import google.generativeai as genai

genai.configure(api_key="AIzaSyCITnB9b-yCyRPvFY5Ils-rofGDy1bh5m0")

for model in genai.list_models():
    if "generateContent" in model.supported_generation_methods:
        print(model.name)

