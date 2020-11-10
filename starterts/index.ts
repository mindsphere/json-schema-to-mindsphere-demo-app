import { MindConnectAgent, MindsphereStandardEvent, retry } from "@mindconnect/mindconnect-nodejs";

(async function () {
    const sleep = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms));
    const configuration = require("./agentconfig.mdsp.json");
    const agent = new MindConnectAgent(configuration);
    const log = (text: any) => {
        console.log(`[${new Date().toISOString()}] ${text.toString()}`);
    };
    const RETRYTIMES = 5; // retry the operation before giving up and throwing exception

    // onboarding the agent
    // Check in the local agent state storage if agent is onboarded.
    // https://opensource.mindsphere.io/docs/mindconnect-nodejs/agent-development/agent-state-storage.html
    if (!agent.IsOnBoarded()) {
        // wrapping the call in the retry function makes the agent a bit more resillient
        // if you don't want to retry the operations you can always just call await agent.OnBoard(); instead.
        await retry(RETRYTIMES, () => agent.OnBoard());
        log("Agent onboarded");
    }

    // you can use agent.Sdk().GetAssetManagementClient() to get the asset id and asset type from mindsphere
    // or just copy them from Asset Manager
    const targetAssetId = "1234567....";

    // instead of creating the data source configuration and mappings separately
    // you can also just use the method below which takes care of everything
    // this is only used for 1:1 asset -> agent mappings
    // the method above can also map the data source configuration to multiple assets
    // just call GenerateMappings with different asset ids

    await agent.ConfigureAgentForAssetId(targetAssetId);

    // Check in the local agent state storage if agent has data source configuration.
    if (!agent.HasDataSourceConfiguration()) {
        await retry(RETRYTIMES, () => agent.GetDataSourceConfiguration());
        log("Configuration aquired");
    }

    for (let index = 0; index < 5; index++) {
        try {
            log(`Iteration : ${index}`);

            // if you have configred the data points in the mindsphere UI you will have to use the long integer values instead of descriptive dataPointIds.

            // take a look at the flow examples at https://playground.mindconnect.rocks
            //
            // - MindSphere expects all values to be encoded as strings
            // - Integers must not have any decimal places
            // - It is a good practice to use javascript literal notation
            //
            // * Examples:
            //
            //   - Random value between 0 and 100: `${Math.random()*100}`
            //   - Variable (HUMIDITY) from input node : `${msg.payload.HUMIDITY}`
            //   - Variable (SPEED) from input node with 0 as default: `${msg.payload.SPEED || 0}`

            const values = [
                {
                    dataPointId: "DP-blocked",
                    qualityCode: "0",
                    value: "false",
                },
                {
                    dataPointId: "DP-servo1_temp",
                    qualityCode: "0",
                    value: `${Math.random() * 10 + 25}`,
                },
                {
                    dataPointId: "DP-vibration",
                    qualityCode: "0",
                    value: "false",
                },
                {
                    dataPointId: "DP-servo0",
                    qualityCode: "0",
                    value: `${Math.ceil(Math.random() * 10 + 1500)}`,
                },
                {
                    dataPointId: "DP-servo1",
                    qualityCode: "0",
                    value: `${Math.ceil(Math.random() * 10 + 1500)}`,
                },
                {
                    dataPointId: "DP-servo2",
                    qualityCode: "0",
                    value: `${Math.ceil(Math.random() * 10 + 1500)}`,
                },
                {
                    dataPointId: "DP-servo3",
                    qualityCode: "0",
                    value: `${Math.ceil(Math.random() * 10 + 1500)}`,
                },
                {
                    dataPointId: "DP-servo4",
                    qualityCode: "0",
                    value: `${Math.ceil(Math.random() * 10 + 1500)}`,
                },
                {
                    dataPointId: "DP-servo5",
                    qualityCode: "0",
                    value: `${Math.ceil(Math.random() * 10 + 1500)}`,
                },
                {
                    dataPointId: "DP-servoangle0",
                    qualityCode: "0",
                    value: `${Math.ceil(Math.random() * 10 + 1500)}`,
                },
                {
                    dataPointId: "DP-servoangle1",
                    qualityCode: "0",
                    value: `${Math.random() * 360 - 180}`,
                },
                {
                    dataPointId: "DP-servoangle2",
                    qualityCode: "0",
                    value: `${Math.random() * 360 - 180}`,
                },
                {
                    dataPointId: "DP-servoangle3",
                    qualityCode: "0",
                    value: `${Math.random() * 360 - 180}`,
                },
                {
                    dataPointId: "DP-servoangle4",
                    qualityCode: "0",
                    value: `${Math.random() * 360 - 180}`,
                },
                {
                    dataPointId: "DP-servoangle5",
                    qualityCode: "0",
                    value: `${Math.random() * 360 - 180}`,
                },
            ];

            // same like above, you can also just call  await agent.PostData(values) if you don't want to retry the operation
            // this is how to send the data with specific timestamp
            // await agent.PostData(values, new Date(Date.now() - 86400 * 1000));

            await retry(RETRYTIMES, () => agent.PostData(values));
            log("Data posted");
            await sleep(1000);

            const event: MindsphereStandardEvent = {
                entityId: agent.ClientId(), // use assetid if you want to send event somewhere else :)
                sourceType: "Event",
                sourceId: "application",
                source: "Meowz",
                severity: 20, // 0-99 : 20:error, 30:warning, 40: information
                timestamp: new Date().toISOString(),
                description: "Test",
            };

            // send event with current timestamp; you can also just call agent.PostEvent(event) if you don't want to retry the operation
            await retry(RETRYTIMES, () => agent.PostEvent(event));
            log("event posted");
            await sleep(1000);

            // upload file
            // the upload-file can be a multipart operation and therefore can be configured to
            // retry the upload of the chunks instead the upload of the whole file.
            // if you don't specify the type , the mimetype is automatically determined by the library
            await agent.UploadFile(agent.ClientId(), "custom/mindsphere/path/package.json", "package.json", {
                retry: RETRYTIMES,
                description: "File uploaded with MindConnect-NodeJS Library",
                chunk: true, // the chunk parameter activates multipart upload
            });

            // see examples online for bulk upload https://opensource.mindsphere.io/docs/mindconnect-nodejs/agent-development/starter-projects.html
        } catch (err) {
            // add proper error handling (e.g. store data somewhere, retry later etc. )
            console.error(err);
        }
    }
})();
