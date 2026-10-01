# shortly — URL shortener API. Standard library only — no pip install, so the build
# needs no PyPI access; only the python:3.12-alpine base is pulled (via the registry mirror).
FROM python:3.12-alpine

WORKDIR /app
COPY app.py /app/app.py

EXPOSE 8000
CMD ["python", "/app/app.py"]
