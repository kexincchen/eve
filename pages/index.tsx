import { useState } from 'react'
import Head from 'next/head'
import { useDropzone } from 'react-dropzone'
import AudioRecorder from '../components/AudioRecorder'
import { FiUpload, FiMic, FiFileText, FiMessageSquare, FiGlobe } from 'react-icons/fi'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [summary, setSummary] = useState('')
  const [translation, setTranslation] = useState('')
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([])
  const [chatInput, setChatInput] = useState('')
  const [activeTab, setActiveTab] = useState('transcribe')

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg']
    },
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0])
    }
  })

  const handleRecordingComplete = (blob: Blob) => {
    const audioFile = new File([blob], 'recording.wav', { type: 'audio/wav' })
    setFile(audioFile)
  }

  const processAudio = async () => {
    if (!file) return
    
    setIsProcessing(true)
    
    try {
      // Create form data for the API request
      const formData = new FormData()
      formData.append('file', file)
      
      // Send to API for transcription
      const transcriptionResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })
      
      const transcriptionData = await transcriptionResponse.json()
      setTranscription(transcriptionData.text)
      
      // Get summary
      const summaryResponse = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: transcriptionData.text }),
      })
      
      const summaryData = await summaryResponse.json()
      setSummary(summaryData.summary)
      
    } catch (error) {
      console.error('Error processing audio:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const translateText = async () => {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: transcription,
          targetLanguage: 'es' // Default to Spanish, could be made selectable
        }),
      })
      
      const data = await response.json()
      setTranslation(data.translation)
    } catch (error) {
      console.error('Error translating text:', error)
    }
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return
    
    const newMessage = { role: 'user', content: chatInput }
    const updatedMessages = [...chatMessages, newMessage]
    setChatMessages(updatedMessages)
    setChatInput('')
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: updatedMessages,
          context: summary 
        }),
      })
      
      const data = await response.json()
      setChatMessages([...updatedMessages, { role: 'assistant', content: data.response }])
    } catch (error) {
      console.error('Error in chat:', error)
    }
  }

  return (
    <>
      <Head>
        <title>Eve - Speech to Text & Summarization</title>
        <meta name="description" content="Convert speech to text and summarize it using AI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen py-8">
        <div className="container">
          <h1 className="text-4xl font-bold text-center mb-8">Eve</h1>
          <p className="text-center text-lg mb-12">Convert speech to text and summarize it using AI</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="card">
              <h2 className="text-2xl font-semibold mb-4">Upload Audio</h2>
              <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary">
                <input {...getInputProps()} />
                <FiUpload className="mx-auto text-3xl mb-2" />
                <p>Drag & drop an audio file here, or click to select</p>
                <p className="text-sm text-gray-500 mt-2">Supports MP3, WAV, M4A, OGG</p>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Or Record Audio</h3>
                <div className="flex flex-col items-center w-full">
                  <AudioRecorder 
                    onRecordingComplete={handleRecordingComplete}
                  />
                </div>
              </div>
              
              {file && (
                <div className="mt-6">
                  <p className="mb-2">Selected file: {file.name}</p>
                  <button 
                    className="btn btn-primary w-full"
                    onClick={processAudio}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Process Audio'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="card">
              <div className="flex border-b mb-4">
                <button 
                  className={`flex items-center px-4 py-2 ${activeTab === 'transcribe' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('transcribe')}
                >
                  <FiFileText className="mr-2" /> Transcription
                </button>
                <button 
                  className={`flex items-center px-4 py-2 ${activeTab === 'translate' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('translate')}
                  disabled={!transcription}
                >
                  <FiGlobe className="mr-2" /> Translation
                </button>
                <button 
                  className={`flex items-center px-4 py-2 ${activeTab === 'chat' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('chat')}
                  disabled={!summary}
                >
                  <FiMessageSquare className="mr-2" /> Chat
                </button>
              </div>
              
              {activeTab === 'transcribe' && (
                <div>
                  <h3 className="text-xl font-medium mb-2">Transcription</h3>
                  <div className="bg-gray-50 p-4 rounded-md mb-6 h-40 overflow-y-auto">
                    {transcription ? transcription : 'Transcription will appear here...'}
                  </div>
                  
                  <h3 className="text-xl font-medium mb-2">Summary</h3>
                  <div className="bg-gray-50 p-4 rounded-md h-40 overflow-y-auto">
                    {summary ? summary : 'Summary will appear here...'}
                  </div>
                </div>
              )}
              
              {activeTab === 'translate' && (
                <div>
                  <h3 className="text-xl font-medium mb-2">Translation</h3>
                  <div className="bg-gray-50 p-4 rounded-md mb-4 h-64 overflow-y-auto">
                    {translation ? translation : 'Translation will appear here...'}
                  </div>
                  <button 
                    className="btn btn-secondary w-full"
                    onClick={translateText}
                    disabled={!transcription}
                  >
                    Translate to Spanish
                  </button>
                </div>
              )}
              
              {activeTab === 'chat' && (
                <div>
                  <h3 className="text-xl font-medium mb-2">Chat about the summary</h3>
                  <div className="bg-gray-50 p-4 rounded-md mb-4 h-64 overflow-y-auto">
                    {chatMessages.length > 0 ? (
                      chatMessages.map((msg, index) => (
                        <div key={index} className={`mb-3 ${msg.role === 'user' ? 'text-right' : ''}`}>
                          <span className={`inline-block px-3 py-2 rounded-lg ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                            {msg.content}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">Ask questions about the summary...</p>
                    )}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 border rounded-l-md px-3 py-2"
                      placeholder="Type your message..."
                      onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    />
                    <button 
                      className="bg-primary text-white px-4 py-2 rounded-r-md"
                      onClick={sendChatMessage}
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
} 