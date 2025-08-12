import React, { useState } from 'react';

// Main application component for the AI meal planning agent.
const App = () => {
  // State for user input, agent's output, and UI status.
  const [preferences, setPreferences] = useState('');
  const [mealPlan, setMealPlan] = useState(null);
  const [agentSteps, setAgentSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // A constant to be used as a delimiter in the prompt.
  const DELIMITER = "---PLAN---";

  // Function to handle the generation of the meal plan.
  const handleGeneratePlan = async () => {
    // Exit if already loading or no preferences are entered
    if (loading || preferences.trim() === '') {
      return;
    }
    setLoading(true);
    setMealPlan(null);
    setAgentSteps([]);
    setError(null);

    // This is the prompt that instructs the AI agent. It tells the model to
    // first outline its plan and then provide the final output.
    const prompt = `Act as a helpful and friendly AI meal planning agent. Your task is to create a weekly meal plan based on the user's preferences.
    
    Here are the user's preferences: ${preferences}
    
    First, outline the steps you will take to generate the meal plan. Think step-by-step about what a human would do. Use a simple list format for your plan. The plan should include things like "Analyze user preferences," "Search for suitable recipes," "Create a balanced weekly schedule," and "Generate a detailed grocery list."
    
    After you have finished listing your steps, use the delimiter "${DELIMITER}" to separate your process from the final meal plan.
    
    Finally, provide a comprehensive weekly meal plan. The plan should be a JSON array of objects, with each object representing a day and containing keys for "day", "breakfast", "lunch", and "dinner". For each meal, format the value as "Food Name, Quantity." Do not include any text before or after the JSON.
    `;
    
    try {
      // API call to the Gemini model.
      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }]
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        // Split the response into the agent's steps and the final JSON string.
        const [stepsText, jsonText] = text.split(DELIMITER);
        
        // Process the steps into an array.
        const steps = stepsText.split('\n').filter(line => line.trim().length > 0);
        setAgentSteps(steps);
        
        // Use a small delay to simulate the agent "thinking" before showing the final plan.
        setTimeout(() => {
          try {
            // Clean the JSON string by removing markdown code fences if they exist.
            let cleanJsonText = jsonText.trim();
            if (cleanJsonText.startsWith("```json")) {
              cleanJsonText = cleanJsonText.substring("```json".length);
            }
            if (cleanJsonText.endsWith("```")) {
              cleanJsonText = cleanJsonText.substring(0, cleanJsonText.length - "```".length);
            }
            const parsedPlan = JSON.parse(cleanJsonText.trim());
            setMealPlan(parsedPlan);
          } catch (e) {
            console.error("Failed to parse JSON:", e);
            setError("The agent generated an invalid plan format. Please try again.");
          }
          setLoading(false);
        }, 2000); // Simulate a 2-second thinking delay

      } else {
        throw new Error("No text response from the model.");
      }

    } catch (e) {
      setError(`An error occurred: ${e.message}`);
      setLoading(false);
    }
  };

  // Helper function to render meal text with bolding
  const renderMealText = (mealText) => {
    // This splits the string at the first comma to separate the food name from the quantity
    const parts = mealText.split(',');
    const foodName = parts[0].trim();
    const quantity = parts.slice(1).join(',').trim();
    
    return (
      <p className="text-xs text-gray-700">
        <span className="font-bold text-gray-900">{foodName}</span>{quantity && `, ${quantity}`}
      </p>
    );
  };
  
  // Handle Enter key press in the textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGeneratePlan();
    }
  };

  return (
    // Updated background to cyan-100 for a different color theme.
    <div className="min-h-screen bg-cyan-100 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl p-6 sm:p-10">
        {/* Updated title as per user request */}
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-2">
          Karthik's AI agent to Plan Meals 🥑
        </h1>
        <p className="text-center text-gray-500 mb-8 sm:mb-12">
          Tell me your dietary preferences, budget, and available ingredients. I'll create a full weekly plan for you.
        </p>

        <div className="mb-6">
          <label htmlFor="preferences" className="block text-gray-700 font-medium mb-2">
            Your Preferences (e.g., "vegetarian, under $100 budget, I have chicken and rice already")
          </label>
          <textarea
            id="preferences"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            onKeyDown={handleKeyDown} // Add the event handler for the Enter key
            className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 resize-none"
            placeholder="Tell me about your dietary needs, budget, and what you have on hand..."
          />
        </div>

        <button
          onClick={handleGeneratePlan}
          disabled={loading || preferences.trim() === ''}
          className={`w-full py-3 px-6 rounded-lg font-bold transition-all duration-300
            ${loading || preferences.trim() === ''
              ? 'bg-blue-300 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg'}`
          }
        >
          {loading ? 'Generating...' : 'Generate Meal Plan'}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {loading && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Agent's Process</h2>
            <div className="space-y-4">
              {agentSteps.length > 0 && agentSteps.map((step, index) => (
                <div key={index} className="bg-gray-200 p-4 rounded-lg flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-gray-700">{step}</p>
                </div>
              ))}
              {agentSteps.length === 0 && (
                <p className="text-center text-gray-500">Thinking...</p>
              )}
            </div>
          </div>
        )}

        {mealPlan && (
          <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Weekly Meal Plan</h2>
            <div className="w-full">
              <table className="table-fixed w-full divide-y divide-gray-300 rounded-lg overflow-hidden">
                <thead className="bg-gray-200">
                  <tr>
                    {/* Adjusted column widths for a more compact and balanced look */}
                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-1/6">Day</th>
                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-5/18">Breakfast</th>
                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-5/18">Lunch</th>
                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-5/18">Dinner</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mealPlan.map((day, index) => (
                    <tr key={index} className="hover:bg-gray-100 transition-colors">
                      <td className="px-2 py-2 text-xs font-medium text-gray-900 break-all">{day.day}</td>
                      <td className="px-2 py-2 break-words">{renderMealText(day.breakfast)}</td>
                      <td className="px-2 py-2 break-words">{renderMealText(day.lunch)}</td>
                      <td className="px-2 py-2 break-words">{renderMealText(day.dinner)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
