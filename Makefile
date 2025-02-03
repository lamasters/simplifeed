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