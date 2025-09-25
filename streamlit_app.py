import streamlit as st
import requests
from datetime import datetime
import json

st.set_page_config(
    page_title="Full Stack Demo",
    page_icon="🚀",
    layout="centered"
)

def generate_text_locally():
    """Generate text locally without backend"""
    return {
        "text": "This is some generated text from the Streamlit app!",
        "timestamp": datetime.now().isoformat()
    }

def generate_text_from_api():
    """Generate text from FastAPI backend"""
    try:
        response = requests.get("http://localhost:8000/generate-text", timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        st.error(f"Error connecting to backend: {e}")
        return None

st.title("🚀 Full Stack Demo")
st.markdown("---")

st.markdown("""
### Choose your text generation method:
""")

col1, col2 = st.columns(2)

with col1:
    st.subheader("🔥 Local Generation")
    st.markdown("Generate text directly in Streamlit")

    if st.button("Generate Text (Local)", type="primary"):
        with st.spinner("Generating text..."):
            result = generate_text_locally()
            st.success("Text generated successfully!")
            st.markdown(f"**Generated Text:** {result['text']}")
            st.markdown(f"**Timestamp:** {result['timestamp']}")

with col2:
    st.subheader("🌐 API Generation")
    st.markdown("Generate text from FastAPI backend")

    if st.button("Generate Text (API)", type="secondary"):
        with st.spinner("Fetching from backend..."):
            result = generate_text_from_api()
            if result:
                st.success("Text fetched from API successfully!")
                st.markdown(f"**Generated Text:** {result['text']}")
                st.markdown(f"**Timestamp:** {result['timestamp']}")

st.markdown("---")

with st.expander("📋 How to run the backend (optional)"):
    st.code("""
# Install dependencies
pip install fastapi uvicorn pydantic

# Start the backend server
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Backend will be available at http://localhost:8000
    """, language="bash")

st.markdown("---")

st.markdown("""
### 📁 Project Structure:
- `streamlit_app.py` - This Streamlit app (all-in-one solution)
- `frontend/` - React + Vite + TypeScript + Tailwind frontend
- `backend/` - FastAPI + Pydantic backend

### 🚀 To run this Streamlit app:
```bash
pip install streamlit requests
streamlit run streamlit_app.py
```
""")