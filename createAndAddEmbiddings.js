const addEmbidding = async (req, res, pineconeClient, indexName, directoryDocs) => {
  const separators = ["\n", "•", "Q\\d+: ", "1.", "A\\."];
  const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separator: new RegExp(separators.join("|")),
  });

  try {
    for (const doc of directoryDocs) {
      const textSource = doc.metadata.source;
      console.log(`\n🔍 Processing document: ${textSource}`);
      const text = doc.pageContent;
      const metadata = doc.metadata;

      const splitDoc = await textSplitter.createDocuments([text], [metadata]);
      console.log(`📚 Split into ${splitDoc.length} chunks`);

      // Embed in small batches
      const { HuggingFaceTransformersEmbeddings } = require("@langchain/community/embeddings/huggingface_transformers");
      const model = new HuggingFaceTransformersEmbeddings({
        model: "Xenova/all-MiniLM-L6-v2",
      });

      const embiddings = [];
      const embedBatchSize = 5;
      for (let i = 0; i < splitDoc.length; i += embedBatchSize) {
        const chunkBatch = splitDoc.slice(i, i + embedBatchSize);
        const cleanedChunks = chunkBatch.map(chunk =>
          chunk.pageContent.replace(/(\nØ|\n|\t\d*|\t)/g, " ")
        );

        const batchEmbeds = await model.embedDocuments(cleanedChunks);
        embiddings.push(...batchEmbeds);
        console.log(`✅ Embedded ${Math.min(i + embedBatchSize, splitDoc.length)} / ${splitDoc.length}`);
      }

      // Step 3: Upsert to Pinecone
      console.log("📌 Retrieving Pinecone index...");
      const index = pineconeClient.Index(indexName);
      console.log(`✅ Pinecone index retrieved: ${indexName}`);

      const upsertBatchSize = 3;
      let batch = [];
      for (let idx = 0; idx < splitDoc.length; idx++) {
        const chunk = splitDoc[idx];
        const vector = {
          id: `${chunk.metadata.source}_pageno=${chunk.metadata.loc.pageNumber}_chunkno=${idx + 1}`,
          values: embiddings[idx],
          metadata: {
            loc: JSON.stringify(chunk.metadata.loc),
            pageContent: chunk.pageContent,
            txtPath: chunk.metadata.source,
          },
        };
        batch.push(vector);

        if (batch.length === upsertBatchSize || idx === splitDoc.length - 1) {
          await index.upsert(batch);
          batch = [];
        }
      }
      console.log(`📌 Upserted ${splitDoc.length} vectors to Pinecone.`);

      // Log memory usage
      const used = process.memoryUsage().rss / 1024 / 1024;
      console.log(`🧠 Memory used: ${Math.round(used)} MB`);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        console.log("🧹 Manual GC triggered.");
      }
    }

  } catch (err) {
    console.log("❌ ERROR:", err);
    res.status(500).json({
      message: "Error creating embeddings and storing to Pinecone database",
      error: err,
    });
  }
};

module.exports = { addEmbidding };
