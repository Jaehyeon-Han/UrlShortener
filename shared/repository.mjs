import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { config } from "./config.mjs";

const client = new DynamoDBClient();
const db = DynamoDBDocumentClient.from(client);

export async function findByOriginalUrl(originalUrl) {
    const result = await db.send(new QueryCommand({
        TableName: config.tableName,
        IndexName: "long_url_idx",
        KeyConditionExpression: "originalUrl = :url",
        ExpressionAttributeValues: {
            ":url": originalUrl
        },
        Limit: 1
    }));

    return result.Items?.[0] ?? null;
}

export async function save(shortCode, originalUrl) {
    await db.send(new PutCommand({
        TableName: config.tableName,
        Item: {
            shortCode,
            originalUrl,
            createdAt: Date.now()
        },
        ConditionExpression: "attribute_not_exists(shortCode)"
    }));
}
