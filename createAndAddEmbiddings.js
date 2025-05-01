//Step 1: Split each pages in directoryDocs into chunks(using for in directoryDocs give you each page and for each page we create array of chunks and array of embiddings, use that to store to db in batches)
//Step 2: Do embiddings for array of chunks for each page one by one
//Step 3: create  a vector with id, vale: embideings, metadata{source loc, page numbers, pageContent} for each chunk and store to db


    const addEmbidding = async (req,res,pineconeClient, indexName, directoryDocs) => {
    //Strp 1:
    //List the separators on which the text would split like near about 1000 char search for this separators and split
    const separators = [
      "\n", // Split by newline
      "•", // Bullet points (MCQ options)
      "Q\\d+: ", // Question format like "Q1: ", "Q2: "
      "1.", // Numbered list item
      "A\\.", // Option A (e.g., "A. Option 1")
    ];
    //Used RecursiveCharacterTextSplitter install:  @langchain/textsplitters
    const {
      RecursiveCharacterTextSplitter
    } = require("@langchain/textsplitters");

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000, //Number of charecters in each chunks
      chunkOverlap: 200, //Add 200 charecters on each chunks from the previous chunks
      separator: new RegExp(separators.join("|")), //Higher preference for this separators to split
    });
    //NOTE: if i am using textSplitter.splitDocuments() i need to pass directoryDocs directly it will extract the page content from the array of documnets itself
    //      if i am using textSplitter.createDocuments() i nedd to pass the array of just pageContent{Means extract the page content then use it}
  
    //Approch 1
    //If using textSplitter.splitDocuments
    // const splitDocs2 = await textSplitter.splitDocuments(directoryDocs);
    //       console.log(`Text split into ${splitDocs2.length} chunks`);
    //   res.status(200).json({
    //     message: splitDocs2
    // })
  
    //Approch2
    //If using textSplitter.createDocuments:
    // let splitDocs = [];
    try{
    for (const doc of directoryDocs) {
      const textSource = doc.metadata.source;
      console.log(`Processing document: ${textSource}`);
      const text = doc.pageContent;
      const metadata=doc.metadata
      //SplitDoc will contain array [[{pagecontent,mentagata,pageNumber:1 (chunk 1)},{chunks for page no 1 (chunk 2)}],[{chunks for page no 2 (chunk 1)},...]]
      const splitDoc = await textSplitter.createDocuments([text],[metadata]);
      console.log(`Text split into ${splitDoc.length} chunks`);
      // splitDocs.push(splitDoc);


  
    //Step 2:
    //Higging face embeddings, need to install: @langchain/community @langchain/core @huggingface/transformers
    const {
      HuggingFaceTransformersEmbeddings,
    } = require("@langchain/community/embeddings/huggingface_transformers");
    console.log(
      `Using HuggingFaceTransformersEmbeddings endpoint for documents with ${splitDoc.length} text chunks ...`
    );
    
    //Define the model
    const model = new HuggingFaceTransformersEmbeddings({
      model: "Xenova/all-MiniLM-L6-v2",
    });
  
    //Embed documents:  replace the charectes \n{new line} \t\d{means t1,t2..} \nØ with " "
    //embiddings will have array [page 1 chunk 1 embiddings],[page 1 chunk 2 embiddings],..]
    const embiddings = await model.embedDocuments(
      splitDoc.map((chunk) =>
        chunk.pageContent.replace(/(\nØ|\n|\t\d*|\t)/g, " ")
      )
    );
    console.log("Finished embedding documents");
  
  





//Step 3
    console.log("Retrieving Pinecone index...");
  // 1. Retrieve Pinecone index
    const index = pineconeClient.Index(indexName);
  // 2. Log the retrieved index name
    console.log(`Pinecone index retrieved: ${indexName}`);
    // 3. Create and upsert vectors in batches of 100
    //What does upsert dose: adds the embiddings to the database, 
    //what is batch: it is total amount of embiddings that can be stored at a time (max is 100 for free tier)
    const batchSize = 100;
    let batch = [];
    for (let idx = 0; idx < splitDoc.length; idx++) {
        const chunk = splitDoc[idx];
        const vector = {
          id: `${chunk.metadata.source}_pageno=${chunk.metadata.loc.pageNumber}_chunkno=${idx+1}`,
          values: embiddings[idx],
          //This metadta is important to store with the embidings: if we want to show user that your answer is fetched from this source and from page a ,b
          metadata: {
            loc: JSON.stringify(chunk.metadata.loc), //Store the page number and line number of the chunk
            pageContent: chunk.pageContent,
            txtPath:chunk.metadata.source,
          },
        };
        batch.push(vector);
        
        // When batch is full or it's the last item, upsert the vectors
        if (batch.length === batchSize || idx === splitDoc.length - 1) {
          await index.upsert(batch);
          // Empty the batch
          batch = [];
        }
    }
    // 4. Log the number of vectors updated
    console.log(`Pinecone index updated with ${splitDoc.length} vectors`);
  }
}catch(err){
  console.log("ERROR: ",err);
  res.status(404).json({
    message:"Error in creating embiddings and storing it to pinecode database",
    error:err
  })
}
}
module.exports={addEmbidding}