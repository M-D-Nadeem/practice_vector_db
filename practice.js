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


const practice=async ( req, res )=> {
    //Step 1:
  
    //Used to read the Diarectory
    const {
      DirectoryLoader,
    } = require("langchain/document_loaders/fs/directory");
    //Used to read the .pdf file install-> @langchain/community,@langchain/core, pdf-parse
    const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
    //Used to read the .txt file install-> langchain
    const { TextLoader } = require("langchain/document_loaders/fs/text");
    //For .docx file install-> @langchain/community, @langchain/core, mammoth
    // mammoth is used to process .docs file
  
    //For .doc file install-> @langchain/community, @langchain/core, word-extractor
    // word-extractor is used to process .doc file
    const {
      DocxLoader,
    } = require("@langchain/community/document_loaders/fs/docx");
    //For .pptx need to install-> officeparser
    const {
      PPTXLoader,
    } = require("@langchain/community/document_loaders/fs/pptx");
    //For .csv file nedd to install : @langchain/community @langchain/core d3-dsv@2
    const { CSVLoader } = require("@langchain/community/document_loaders/fs/csv");
  
    //For any other type of file reader reffer langchan docs-> https://js.langchain.com/docs/integrations/document_loaders/file_loaders/
  
    //Initail path to reach the directory to be read
    const initailPath = "./prac/";
    //Set up DirectoryLoader to load documents from the ./prac/ directory
    const directoryLoader = new DirectoryLoader(initailPath, {
      ".pdf": (path = string) => new PDFLoader(path),
      ".txt": (path = string) => new TextLoader(path),
      ".docx": (path = string) => new DocxLoader(path),
      ".doc": (path = string) => new DocxLoader(path),
      ".pptx": (path = string) => new PPTXLoader(path),
      ".csv": (path = string) => new CSVLoader(path),
    });
    //This will return an array of object [{pagecontent,meatdata:source,...,"pageNumber": 1},{pagecontent,meatdata:source,...,"pageNumber": 2}] page number wise
    const directoryDocs = await directoryLoader.load();
    



    //Step 4: send the documentRes embiddings to pinecode database
    const { Pinecone } = require('@pinecone-database/pinecone');
    const indexName = "practice-index";
    const vectorDimension = 384;
    const question="Javascript"
    const pineconeClient  = new Pinecone({
    apiKey: 'pcsk_2Y5v31_LcFUfTabTkEZ3gQaxjhEBmiVVWwwNmXwDEJ5TZ2FWK2haqLfXY9AW9XQbCdTKSA'
  });
  
    // (async () => {
      // 1. Check if Pinecone index exists and create if necessary 
        await createPineconeIndex(req,res,pineconeClient, indexName, vectorDimension);
      // 2. Update Pinecone vector store with document embeddings
        await addEmbidding(req,res,pineconeClient, indexName, directoryDocs);
      // 13. Query Pinecone vector store and GPT model for an answer
        await queryPineconeVectorStore(req,res,pineconeClient, indexName, question);
    // })()
  }
    //  res.status(200).json({
    //     message: splitDocs
    // })

  
  
  
  module.exports = practice;
  