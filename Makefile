all: build

.PHONE: build
build: build-functions
	npm run build

build-functions:
	cd functions && tar -czf get_articles.tgz ./get_articles
	mv functions/*.tgz function_builds