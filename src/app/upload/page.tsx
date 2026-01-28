'use client';

import { useState } from 'react';
import { authenticatedFormData } from '@/lib/api-client';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await authenticatedFormData('/api/upload', formData);

      const data = await response.json();
      
      // Check if response was successful
      if (!response.ok) {
        // Server returned an error (400, 500, etc.)
        setResult({ 
          error: data.error || 'Upload failed', 
          details: data.details ? (Array.isArray(data.details) ? data.details : [data.details]) : undefined 
        });
      } else {
        // Success
        setResult(data);
      }
    } catch (error) {
      setResult({ error: 'Network error: Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Upload Candidates</h1>
        
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-semibold mb-4">File Upload</h2>
          <p className="text-gray-600 mb-6">
            Upload a CSV or Excel file with candidate information. The file should include columns for:
            Full Name, Email, Position, Rating, Notes, Rejection Reasons, and Areas for Improvement.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {file && (
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  Selected: <span className="font-medium">{file.name}</span> 
                  ({(file.size / 1024).toFixed(1)} KB)
                </p>
              </div>
            )}
            
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </div>

        {result && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-lg font-semibold mb-4">Upload Results</h3>
            
            {result.error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-600">{result.error}</p>
                {result.details && (
                  <ul className="mt-2 text-sm text-red-600">
                    {result.details.map((detail: string, index: number) => (
                      <li key={index}>• {detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-md">
                    <p className="text-2xl font-bold text-green-600">{result.success}</p>
                    <p className="text-sm text-green-800">Successful</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-md">
                    <p className="text-2xl font-bold text-red-600">{result.errors}</p>
                    <p className="text-sm text-red-800">Errors</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-md">
                    <p className="text-2xl font-bold text-blue-600">{result.results?.length || 0}</p>
                    <p className="text-sm text-blue-800">Total</p>
                  </div>
                </div>
                
                {result.results && (
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Candidate</th>
                          <th className="text-left py-2">Status</th>
                          <th className="text-left py-2">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.results.map((item: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">{item.candidate}</td>
                            <td className="py-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                item.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="py-2 text-red-600">{item.error || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
