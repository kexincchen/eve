import { useState, useRef, useEffect } from 'react'
import { FiMic, FiSquare, FiDownload } from 'react-icons/fi'

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void
}

// Define the SpeechRecognition type for TypeScript
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

// Define the window interface to include the SpeechRecognition constructor
interface CustomWindow extends Window {
  SpeechRecognition: new () => SpeechRecognition;
  webkitSpeechRecognition: new () => SpeechRecognition;
}

// Interface for caption entries
interface CaptionEntry {
  text: string;
  timestamp: string;
  isFinal: boolean;
}

export default function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [captionHistory, setCaptionHistory] = useState<CaptionEntry[]>([])
  const [showDownloadButton, setShowDownloadButton] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Set up the SpeechRecognition
  useEffect(() => {
    // Get the SpeechRecognition constructor
    const SpeechRecognition = (window as unknown as CustomWindow).SpeechRecognition || 
                             (window as unknown as CustomWindow).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        let isFinalResult = false;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            isFinalResult = true;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Set the current visible transcript
        const currentText = finalTranscript || interimTranscript;
        setCurrentTranscript(currentText);
        
        // If we have a final result, add it to the history
        if (isFinalResult && finalTranscript.trim()) {
          const now = new Date();
          const timestamp = now.toLocaleTimeString();
          
          setCaptionHistory(prev => [
            ...prev, 
            { 
              text: finalTranscript.trim(), 
              timestamp, 
              isFinal: true 
            }
          ]);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event);
      };
      
      recognitionRef.current.onend = () => {
        if (isRecording) {
          recognitionRef.current?.start();
        }
      };
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    chunksRef.current = []
    setCurrentTranscript('')
    setCaptionHistory([])
    setShowDownloadButton(false)
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' })
        onRecordingComplete(blob)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        
        // Show download button after recording is completed
        setShowDownloadButton(true)
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      // Add any interim results to history as a final caption
      if (currentTranscript.trim()) {
        const now = new Date();
        const timestamp = now.toLocaleTimeString();
        
        setCaptionHistory(prev => [
          ...prev, 
          { 
            text: currentTranscript.trim(), 
            timestamp, 
            isFinal: true 
          }
        ]);
      }
    }
  }
  
  const saveAsText = () => {
    const fullText = captionHistory
      .map(entry => `[${entry.timestamp}] ${entry.text}`)
      .join('\n\n');
      
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      <div className="flex items-center space-x-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500 text-white hover:bg-red-600"
          >
            <FiMic size={20} />
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-700 text-white hover:bg-gray-800"
          >
            <FiSquare size={20} />
          </button>
        )}
        <span>{isRecording ? 'Recording...' : 'Click to record'}</span>
        
        {showDownloadButton && (
          <button
            onClick={saveAsText}
            className="flex items-center ml-4 px-3 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            <FiDownload className="mr-1" /> Save Transcript
          </button>
        )}
      </div>
      
      {/* Current transcript during recording */}
      {isRecording && (
        <div className="w-full mt-4">
          <h4 className="text-sm font-medium mb-2">Live Caption:</h4>
          <div className="bg-gray-50 p-3 rounded-md min-h-[60px] overflow-y-auto text-sm">
            {currentTranscript || 'Listening...'}
          </div>
        </div>
      )}
      
      {/* Caption history */}
      {(captionHistory.length > 0 || isRecording) && (
        <div className="w-full mt-2">
          <h4 className="text-sm font-medium mb-2">Caption History:</h4>
          <div className="bg-gray-50 p-3 rounded-md max-h-[240px] overflow-y-auto text-sm">
            {captionHistory.length > 0 ? (
              <div className="space-y-3">
                {captionHistory.map((entry, index) => (
                  <div key={index} className="pb-2 border-b border-gray-200 last:border-0">
                    <div className="text-xs text-gray-500 mb-1">{entry.timestamp}</div>
                    <div>{entry.text}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No captions yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 