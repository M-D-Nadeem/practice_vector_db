//What is index in pincode db: An index defines the dimension of vectors to be stored and the similarity metric to be used when querying them.
// In simple words it is like a collection for similar type of dimension and metric
// We create index with : Index name, dimension and metric of the embidding model

//Step 1: cheack if index already exist with the provided name:
//        if yes: no need to create index, just add embiddings to it
//        else:   create new index with the provided name

const createPineconeIndex = async (req,res,
  pineconeClient,
  indexName,
  vectorDimension
) => {
  try{
  // 1. Initiate index existence check
  console.log(`Checking "${indexName}"...`);
  // 2. Get list of existing indexes from the dadabase
  const existingIndexes = await pineconeClient.listIndexes();
  console.log(existingIndexes);
  
  const indexExists = existingIndexes.indexes.some(index => index.name === indexName);
  // 3. If index doesn't exist, create it
  if (!indexExists) {
    // 4. Log index creation initiation
    console.log(`Creating "${indexName}"...`);
    //5. Create index
    const clientIndex = await pineconeClient.createIndex({
      name: indexName,
      dimension: vectorDimension, // Replace with your model dimensions
      metric: "cosine", // Replace with your model metric
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-east-1",
        },
      },
    });
    // 6. Log successful creation
    console.log(`Created client index:`, clientIndex);
    // 7. Wait 60 seconds for index initialization
    await new Promise((resolve) => setTimeout(resolve, 60000));
  } else {
    // 8. Log if index already exists
    console.log(`"${indexName}" already exists.`);
  }
}catch(err){
  console.log("ERROR: ",err);
  res.status(404).json({
    message:"Error in creating index in pinecone",
    error:err
  })
}
};
module.exports={createPineconeIndex}