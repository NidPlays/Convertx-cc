FROM debian:trixie-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
  curl \
  unzip \
  git \
  ca-certificates \
  build-essential \
  assimp-utils \
  calibre \
  dasel \
  dcraw \
  dvisvgm \
  ffmpeg \
  ghostscript \
  graphicsmagick \
  imagemagick-7.q16 \
  inkscape \
  latexmk \
  libheif-examples \
  libjxl-tools \
  libreoffice \
  libva2 \
  libvips-tools \
  libemail-outlook-message-perl \
  lmodern \
  mupdf-tools \
  pandoc \
  poppler-utils \
  potrace \
  python3-numpy \
  resvg \
  texlive \
  texlive-fonts-recommended \
  texlive-latex-extra \
  texlive-latex-recommended \
  texlive-xetex \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://bun.sh/install | bash && \
  ln -s /root/.bun/bin/bun /usr/local/bin/bun

RUN ARCH=$(uname -m) && \
  if [ "$ARCH" = "aarch64" ]; then \
  VTRACER_ASSET="vtracer-aarch64-unknown-linux-musl.tar.gz"; \
  else \
  VTRACER_ASSET="vtracer-x86_64-unknown-linux-musl.tar.gz"; \
  fi && \
  curl -L -o /tmp/vtracer.tar.gz "https://github.com/visioncortex/vtracer/releases/download/0.6.4/${VTRACER_ASSET}" && \
  tar -xzf /tmp/vtracer.tar.gz -C /tmp/ && \
  mv /tmp/vtracer /usr/local/bin/vtracer && \
  chmod +x /usr/local/bin/vtracer && \
  rm /tmp/vtracer.tar.gz

RUN mkdir -p data
ENV NODE_ENV=development
ENV QTWEBENGINE_CHROMIUM_FLAGS="--no-sandbox"
EXPOSE 3000
CMD ["bun", "run", "dev"]