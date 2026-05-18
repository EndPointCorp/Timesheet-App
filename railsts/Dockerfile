FROM ubuntu:18.04

# Set environment variables to avoid interaction during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies for building Ruby and other libraries
RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    libreadline-dev \
    zlib1g-dev \
    libyaml-dev \
    libsqlite3-dev \
    libxml2-dev \
    libxslt1-dev \
    libcurl4-openssl-dev \
    wget \
    libqtwebkit4 \
    libqtwebkit-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Download and install Ruby 2.4.10
RUN wget https://cache.ruby-lang.org/pub/ruby/2.4/ruby-2.4.10.tar.gz && \
    tar -xvzf ruby-2.4.10.tar.gz && \
    cd ruby-2.4.10 && \
    ./configure --prefix=/usr/local && \
    make && \
    make install && \
    cd .. && \
    rm -rf ruby-2.4.10 ruby-2.4.10.tar.gz

# Update RubyGems to the latest compatible version
RUN gem update --system 3.2.3

# Install Bundler 1.17.3, which is compatible with Ruby 2.4 and Rails 5.0.1
RUN gem install bundler -v 1.17.3

# Set working directory in container
WORKDIR /app

# Copy Gemfile and Gemfile.lock to leverage Docker cache
COPY Gemfile Gemfile.lock ./

# Run bundle install
RUN bundle install

# Copy the entire application source code into the container
COPY . .

# Expose the default Rails port (3000)
EXPOSE 3000

# Set default command to start Rails server
CMD ["rails", "server", "-b", "0.0.0.0"]
