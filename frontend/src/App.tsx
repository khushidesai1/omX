import { useState } from 'react'

interface TextResponse {
  text: string
  timestamp: string
}

function App() {
  const [generatedText, setGeneratedText] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const fetchText = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/generate-text')
      const data: TextResponse = await response.json()
      setGeneratedText(data.text)
    } catch (error) {
      console.error('Error fetching text:', error)
      setGeneratedText('Error fetching text from backend')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-6">
                Full Stack Demo
              </h1>
            </div>
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <p>Click the button below to fetch text from the FastAPI backend:</p>
                <div className="pt-6 text-base leading-6 font-bold sm:text-lg sm:leading-7">
                  <button
                    onClick={fetchText}
                    disabled={loading}
                    className="bg-blue-500 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                  >
                    {loading ? 'Loading...' : 'Generate Text'}
                  </button>
                </div>
                {generatedText && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900">Generated Text:</h3>
                    <p className="text-gray-700 mt-2">{generatedText}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
