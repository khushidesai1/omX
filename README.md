# Full Stack Demo App

A simple web application demonstrating frontend-backend communication with multiple deployment options.

## =€ Quick Start with Streamlit

```bash
pip install -r requirements.txt
streamlit run streamlit_app.py
```

Visit: http://localhost:8501

## =Á Project Structure

- `streamlit_app.py` - Main Streamlit app (recommended for deployment)
- `requirements.txt` - Python dependencies for Streamlit
- `frontend/` - React + Vite + TypeScript + Tailwind frontend
- `backend/` - FastAPI + Pydantic backend

## < Deployment Options

### Streamlit Community Cloud (Recommended)
1. Push this repo to GitHub
2. Visit [share.streamlit.io](https://share.streamlit.io)
3. Connect your GitHub repo
4. Deploy `streamlit_app.py`
5. Get your permanent URL!

### Full Stack Deployment
- **Frontend**: Deploy to Vercel/Netlify
- **Backend**: Deploy to Railway/Render/Heroku

## ( Features

- **Local Text Generation**: Works without any backend
- **API Integration**: Optional connection to FastAPI backend
- **Responsive Design**: Clean, professional interface
- **Error Handling**: Graceful fallbacks for connectivity issues

## =à Development

### Run Full Stack Version

Backend:
```bash
cd backend
pip install fastapi uvicorn pydantic
uvicorn main:app --reload --port 8000
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```