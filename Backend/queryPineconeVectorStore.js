const {
  HuggingFaceTransformersEmbeddings,
} = require("@langchain/community/embeddings/huggingface_transformers");
const { ChatGroq } = require("@langchain/groq");

const queryPineconeVectorStore = async (
  req,
  res,
  pineconeClient,
  indexName,
  question,
  responseLength
) => {
  try {
    console.log("Querying Pinecone vector store...");

    const index = pineconeClient.Index(indexName);
    const model = new HuggingFaceTransformersEmbeddings({
      model: "Xenova/all-MiniLM-L6-v2",
    });
    const queryEmbedding = await model.embedQuery(question);

    const queryResponse = await index.query({
      topK: 10,
      vector: queryEmbedding,
      includeMetadata: true,
      includeValues: true,
    });

    console.log(`Found ${queryResponse.matches.length} matches...`);
    console.log(`Asking question: ${question}...`);

    const llm = new ChatGroq({
      temperature: 0.7,
      apiKey: "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",
      model: "llama-3.3-70b-versatile",
    });

    const topDocs = queryResponse.matches
      .map((match, i) => match.metadata.text || JSON.stringify(match.metadata))
      .join("\n\n");

    const prompt = `
You are a smart, concise assistant.

Based on the following context, answer the user's question clearly and engagingly. 
Keep the answer informative, relevant, and **no longer than ${responseLength} lines**.

Question:
"${question}"

Context:
${topDocs}

Give only the final answer (no intro, no notes), but keep it attractive and natural.
`;

    const response = await llm.invoke([{ role: "user", content: prompt }]);
    const finalAnswer = response.content.trim();

    return res.status(200).json({ answer: finalAnswer });
  } catch (err) {
    console.error("Error during query:", err);
    res.status(500).json({ error: "Failed to query vector store." });
  }
};

module.exports = { queryPineconeVectorStore };
