//Steps:
//Step 1:
// Load all files from diarectory using DirectoryLoader
// Based on the file type use packages( such as for .pdf use PDFLoader and etc) to read the files
//Step 2:
// use RecursiveCharacterTextSplitter to split the documents into chunks
// pass that chunks for embeddings here i have used - HuggingFaceTransformersEmbeddings(model:Xenova/all-MiniLM-L6-v2 )
//Step 3
//Create index for vector database pinecone

const { addEmbidding } = require("./createAndAddEmbiddings.js");
const { createPineconeIndex } = require("./createVectorIndex.js");
const { queryPineconeVectorStore } = require("./queryPineconeVectorStore.js");
const fs = require('fs');
const path = require('path');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);

const practice = async (req, res) => {
  try {

    // Get the question and response length from request body
    const question = req.body.question;
    const responseLength = parseInt(req.body.responseLength) || 5;
    
    console.log(`Processing question: "${question}" with response length: ${responseLength}`);

    // Check if files are available
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Create temporary directory to store uploaded files
    const uploadDir = "./prac/";
    try {
      if (!fs.existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }
    } catch (err) {
      console.error("Error creating upload directory:", err);
      return res.status(500).json({ error: "Failed to create upload directory" });
    }

    // Save uploaded files to the prac directory
    for (const file of req.files) {
      
      const filePath = path.join(uploadDir, file.originalname);
      try {
        await writeFile(filePath, file.buffer);
        console.log(`File saved: ${filePath}`);
      } catch (err) {
        console.error(`Error saving file ${file.originalname}:`, err);
        return res.status(500).json({ error: `Failed to save file ${file.originalname}` });
      }
    }

    // Load the saved files
    const { DirectoryLoader } = require("langchain/document_loaders/fs/directory");
    const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
    const { TextLoader } = require("langchain/document_loaders/fs/text");
    const { DocxLoader } = require("@langchain/community/document_loaders/fs/docx");
    const { PPTXLoader } = require("@langchain/community/document_loaders/fs/pptx");
    const { CSVLoader } = require("@langchain/community/document_loaders/fs/csv");

    // Initialize DirectoryLoader
    const directoryLoader = new DirectoryLoader(uploadDir, {
      ".pdf": (path) => new PDFLoader(path),
      ".txt": (path) => new TextLoader(path),
      ".docx": (path) => new DocxLoader(path),
      ".doc": (path) => new DocxLoader(path),
      ".pptx": (path) => new PPTXLoader(path),
      ".csv": (path) => new CSVLoader(path),
    });

    // Load documents from the directory
    const directoryDocs = await directoryLoader.load();
    
    console.log(`Loaded ${directoryDocs.length} documents`);

    // Connect to Pinecone and process documents
    const { Pinecone } = require('@pinecone-database/pinecone');
    const indexName = "practice-index";
    const vectorDimension = 384;
    
    const pineconeClient = new Pinecone({
      apiKey: 'pcsk_2Y5v31_LcFUfTabTkEZ3gQaxjhEBmiVVWwwNmXwDEJ5TZ2FWK2haqLfXY9AW9XQbCdTKSA'
    }); 

    try {
      // 1. Check if Pinecone index exists and create if necessary
      await createPineconeIndex(req, res, pineconeClient, indexName, vectorDimension);
      
      // 2. Update Pinecone vector store with document embeddings
      await addEmbidding(req, res, pineconeClient, indexName, directoryDocs);
      
      // 3. Query Pinecone vector store and GPT model for an answer
      await queryPineconeVectorStore(req, res, pineconeClient, indexName, question, responseLength);
    } catch (error) {
      console.error("Error during Pinecone operations:", error);
      return res.status(500).json({ error: "Error processing documents with Pinecone" });
    }

    // Note: We're not sending a response here because queryPineconeVectorStore should handle the response
    // If that's not the case, you should add a response here

  } catch (error) {
    console.error("Unhandled error in practice function:", error);
    return res.status(500).json({ 
      error: "An unexpected error occurred", 
      message: error.message 
    });
  }
};

module.exports = practice ;
    //  res.status(200).json({
    //     message: splitDocs
    // })

  
  
  
  