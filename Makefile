.PHONY: install dev build clean

install:
	cd client && npm install
	cd server && npm install
	npm install

dev:
	npx concurrently -n "SERVER,CLIENT" -c "cyan,magenta" "cd server && npm run dev" "cd client && npm run dev"

build:
	cd client && npm run build

clean:
	rm -rf client/node_modules client/dist server/node_modules node_modules
