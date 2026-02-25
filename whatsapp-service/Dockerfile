FROM oven/bun:alpine

WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
RUN bun run db:generate
RUN bun run db:migrate:deploy

EXPOSE 3001
ENV PORT=3001

ENV HOSTNAME="0.0.0.0"

CMD ["bun", "run", "start"]