# shortly backend — Node.js URL shortener API. Uses the standard pg and redis
# npm packages, so the build needs npm registry access.
FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY src ./src

EXPOSE 8000
CMD ["node", "src/server.js"]
