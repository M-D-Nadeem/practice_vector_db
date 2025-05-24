import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { File, Upload, Search, ArrowRight, Sparkles, X, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import axiosInstance from './axiosInstance';

export default function FileQAWebsite() {
  const [files, setFiles] = useState([]);
  const [question, setQuestion] = useState('');
  const [responseLength, setResponseLength] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [isFilesOpen, setIsFilesOpen] = useState(true);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0 || !question.trim()) return;

    setIsLoading(true);
    
    try {
      // Create form data to send files and other data
      const formData = new FormData();
      
      // Append each file to the form data
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });
      
      // Add the question and response length to form data
      formData.append('question', question);
      formData.append('responseLength', responseLength);
      // console.log(files);
      
      console.log(formData);
      
      // Send the data to your backend API endpoint
      const response = await axiosInstance.post('http://localhost:5000/practice', formData, 
        {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    console.log(response);
    
      
      // Set the answer from the backend response
      setAnswer(response.data.answer);
    } catch (error) {
      console.error('Error submitting data:', error);
      setAnswer('An error occurred while processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    setFiles([]);
    setQuestion('');
    setResponseLength(5);
    setAnswer('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">Document Intelligence</h1>
          <p className="text-xl text-blue-200">Upload your files, ask questions, get answers</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl"
          >
            <div>
              {/* File Upload */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold flex items-center">
                    <File className="mr-2" />
                    Documents
                    <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      {files.length}
                    </span>
                  </h2>
                  <button 
                    type="button" 
                    onClick={() => setIsFilesOpen(!isFilesOpen)}
                    className="text-blue-300 hover:text-white"
                  >
                    {isFilesOpen ? <ChevronUp /> : <ChevronDown />}
                  </button>
                </div>

                <AnimatePresence>
                  {isFilesOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div
                        onClick={() => fileInputRef.current.click()}
                        className="border-2 border-dashed border-blue-400 rounded-lg p-8 mb-4 text-center cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          ref={fileInputRef}
                        />
                        <Upload className="mx-auto mb-2 text-blue-300" size={40} />
                        <p>Drag files here or click to browse</p>
                        <p className="text-sm text-blue-300 mt-2">
                          Upload multiple files of any format
                        </p>
                      </div>

                      {files.length > 0 && (
                        <div className="bg-white/5 rounded-lg p-3 max-h-40 overflow-y-auto">
                          {files.map((file, index) => (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              key={index}
                              className="flex items-center justify-between bg-white/10 rounded-md px-3 py-2 mb-2"
                            >
                              <div className="flex items-center">
                                <File size={16} className="mr-2 text-blue-300" />
                                <span className="truncate max-w-xs">{file.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X size={16} />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Question Input */}
              <div className="mb-6">
                <label className="block text-xl font-semibold mb-2 flex items-center">
                  <Search className="mr-2" />
                  Your Question
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full bg-white/5 border border-blue-400/30 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="What would you like to know about these documents?"
                  rows={3}
                />
              </div>

              {/* Response Length */}
              <div className="mb-8">
                <label className="block font-semibold mb-2">Response Length (lines)</label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={responseLength}
                    onChange={(e) => setResponseLength(Number(e.target.value))}
                    className="w-full h-2 bg-blue-500/30 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="ml-3 bg-blue-500 px-2 py-1 rounded-md min-w-6 text-center">
                    {responseLength}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleSubmit}
                  disabled={files.length === 0 || !question.trim() || isLoading}
                  className={`flex-1 bg-gradient-to-r from-blue-500 to-purple-500 py-3 rounded-lg font-bold flex items-center justify-center ${
                    (files.length === 0 || !question.trim() || isLoading) ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <>
                      Get Answer <ArrowRight className="ml-2" />
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={clearAll}
                  className="px-4 py-3 border border-blue-400 rounded-lg hover:bg-white/10"
                >
                  Clear All
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Sparkles className="mr-2 text-yellow-300" />
              AI Response
            </h2>

            <div className="min-h-64 bg-black/20 rounded-lg p-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="relative w-16 h-16">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500/30 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                  <p className="mt-4 text-blue-300">Analyzing your documents...</p>
                </div>
              ) : answer ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-pre-line"
                >
                  {answer}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center h-64 text-blue-300">
                  <Search size={48} className="mb-4 opacity-50" />
                  <p>Your analysis will appear here</p>
                  <p className="text-sm mt-2">Upload files, ask a question, and hit "Get Answer"</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold mb-8 text-center">Key Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Multi-file Analysis",
                description: "Upload and analyze multiple documents simultaneously",
                icon: <File className="text-blue-300" />
              },
              {
                title: "Customizable Length",
                description: "Specify exactly how detailed you want your answers to be",
                icon: <ChevronUp className="text-green-300" />
              },
              {
                title: "Intelligent Processing",
                description: "Advanced AI extracts meaningful insights from your documents",
                icon: <Sparkles className="text-yellow-300" />
              }
            ].map((feature, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:bg-white/15 transition-colors"
              >
                <div className="rounded-full bg-blue-900/50 w-12 h-12 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-blue-200">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      
      <footer className="mt-16 py-6 bg-black/20">
        <div className="container mx-auto px-4 text-center text-blue-300">
          <p>Document Intelligence Platform • Analyze any document with AI</p>
        </div>
      </footer>
    </div>
  );
}