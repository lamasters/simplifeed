deploy_ai:
	appwrite functions create-deployment \
	--function-id=65bed72070bb85067dd9 \
	--entrypoint='summarize.py' \
	--commands='pip install -r requirements.txt' \
	--code="./functions/summarize_article" \
	--activate=true

deploy_feeds:
	appwrite functions create-deployment \
	--function-id=652ae2169262a1dfc5f8 \
	--entrypoint='get_feeds.py' \
	--commands='pip install -r requirements.txt' \
	--code="./functions/get_feeds" \
	--activate=true

deploy_test_feeds:
	appwrite functions create-deployment \
	--function-id=674621f700179bb45434 \
	--entrypoint='get_feeds.py' \
	--commands='pip install -r requirements.txt' \
	--code="./functions/get_feeds" \
	--activate=true

deploy_record_listen_time:
	appwrite functions create-deployment \
	--function-id=674661f2001479869775 \
	--entrypoint='record_listen_time.py' \
	--commands='pip install -r requirements.txt' \
	--code="./functions/record_listen_time" \
	--activate=true

deploy_index_news_feed:
	appwrite functions create-deployment \
	--function-id=679fc996043c9a90e2df \
	--entrypoint='index_news_feed.py' \
	--commands='pip install -r requirements.txt' \
	--code="./functions/index_news_feed" \
	--activate=true

deploy_index_podcast_feed:
	appwrite functions create-deployment \
	--function-id=679fe0e256c67950d62e \
	--entrypoint='index_podcast_feed.py' \
	--commands='pip install -r requirements.txt' \
	--code="./functions/index_podcast_feed" \
	--activate=true

deploy_create_news_feed:
	appwrite functions create-deployment \
	--function-id=67a12be8e3a2ad0d676e \
	--entrypoint='create_news_feed.py' \
	--commands='pip install -r requirements.txt' \
	--code="./functions/create_news_feed" \
	--activate=true

deploy_create_podcast_feed:
	appwrite functions create-deployment \
	--function-id=67a147e4791d9ec6e02f \
	--entrypoint='create_podcast_feed.py' \
	--commands='pip install -r requirements.txt' \
	--code="./functions/create_podcast_feed" \
	--activate=true

deploy_get_article:
	appwrite functions create-deployment \
	--function-id=67a15bad9774f8a009c5 \
	--entrypoint='get_article.py' \
	--commands='pip install -r requirements.txt' \
	--code="./functions/get_article" \
	--activate=true

deploy_scheduler:
	appwrite functions create-deployment \
	--function-id=67a165e260f7bd4375f4 \
	--entrypoint='scheduler.py' \
	--commands='pip install -r requirements.txt' \
	--code="./functions/scheduler" \
	--activate=true