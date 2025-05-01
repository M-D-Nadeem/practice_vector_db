const {
    HuggingFaceTransformersEmbeddings,
  } = require("@langchain/community/embeddings/huggingface_transformers");
const { default: axios } = require("axios");
const { ChatGroq } = require("@langchain/groq");
const { ChatPromptTemplate } = require("@langchain/core/prompts");

const queryPineconeVectorStore = async (req,res,
    pineconeClient,
    indexName,
    question
  ) => {
  // 3. Start query process
    console.log("Querying Pinecone vector store...");
  // 4. Retrieve the Pinecone index
    const index = pineconeClient.Index(indexName);
  // 5. Create query embedding
    const model = new HuggingFaceTransformersEmbeddings({
    model: "Xenova/all-MiniLM-L6-v2",
  });
  const queryEmbedding  = await model.embedQuery(question);
  
  // 6. Query Pinecone index and return top 10 matches
    let queryResponse = await index.query({
     
        topK: 10,
        vector: queryEmbedding,
        includeMetadata: true,
        includeValues: true,
      
    });
    
  // 7. Log the number of matches 
    console.log(`Found ${queryResponse.matches.length} matches...`);
  // 8. Log the question being asked
    console.log(`Asking question: ${question}...`);


    //If using Ollama: first run the ollama llama2 model in local machine {in command prompt: ollama run llama2}
    
    // const topDocs = queryResponse.matches.map((match, i) => {
    //     return `Document ${i + 1}:\n${match.metadata.text || JSON.stringify(match.metadata)}`;
    //   }).join("\n\n");
    
    //   const prompt = `
    // You are a helpful assistant. Use the following context to answer the question. 
    // If the answer isn't in the context, say "I don't know."
    
    // Context:
    // ${topDocs}
    
    // Question: ${question}
    
    // Answer:
    // `;

    // 🔗 Replace with your actual EC2 Ollama IP or localhost if running locally
// const ollamaResponse = await axios.post("http://localhost:11434/api/generate", json={
//   model: "llama2",
//   prompt:prompt,
//   stream: false,
// });
// console.log(ollamaResponse);

// const answer = ollamaResponse.data.response;
// console.log("Generated Answer:", answer);


    //If using langchan Groq: just craete one account in groq cloud and get the api key
    const llm = new ChatGroq({
      temperature: 0.7,
      apiKey: "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",
      model: "llama-3.3-70b-versatile", 
    });

    const topDocs = queryResponse.matches
    .map((match, i) => {
      return `Document ${i + 1}:\n${match.metadata.text || JSON.stringify(match.metadata)}`;
    })
    .join("\n\n");

    const prompt = `
    You are an expert quiz generator.
    
    Using the following context, generate exactly 5 multiple-choice questions in JSON format. 
    Each question must include:
    - "question": the question text
    - "options": an array of 4 answer choices
    - "correct_answer": the exact correct option from the options array
    
    Make sure:
    - The questions are relevant to the context
    - Each question has only one correct answer
    - Output only valid JSON
    
    Context:
    ${topDocs}
    
    Output Format Example:
    [
      {
        "question": "What is the capital of France?",
        "options": ["Berlin", "Paris", "Rome", "Madrid"],
        "correct_answer": "Paris"
      },
      ...
    ]
    
    Now generate 5 such MCQs.
    `;
const response = await llm.invoke([{ role: "user", content: prompt }]);

    
    const mcqRaw = response.content.trim();
    const cleanJson = mcqRaw.replace(/```json|```/g, "").trim();
    // console.log("MCQ Generated:", cleanJson);
    res.status(200).json({ mcqs: JSON.parse(cleanJson) });
      
}
module.exports={queryPineconeVectorStore}


