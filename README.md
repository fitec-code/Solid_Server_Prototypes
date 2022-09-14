# Solid_Server_Prototypes
Ensure solid community server is set up on local machine
run a community solid server on http://localhost:3000/ using community-solid-server command


run the following code from terminal:

npm install webpack

cd ClientApp
npm run build
npm run start


on separate terminal run

cd CollectorApp
npm run build
npm run start


Create two accounts through  http://localhost:3000/ one called HeatingCollector, the other called User1

in the client app log into the User1 account and fill in data
ensure data is saved to pod

in the collector app log into the Heating Collector and fill in data, once bottom button is clicked the aggregated stats are shown in console