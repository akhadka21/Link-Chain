
import 'dotenv/config';
import { ChatOpenRouter } from "@langchain/openrouter";

const model = new ChatOpenRouter({
    model: "meta-llama/llama-3.1-8b-instruct",
    apiKey: process.env.OPENROUTER_API_KEY,
});

// Step 1: Ask the model to plan the task
const best1 = "Air Canada ($689.74): SFO (7:30 PM, Jul 11) ➔ YVR (9:50 PM) [15h 55m layover] YVR (1:45 PM, Jul 12) ➔ KIX (4:25 PM, Jul 13); Return: KIX (6:00 PM, Aug 11) ➔ YVR (11:35 AM) [1h 25m layover] YVR (1:00 PM) ➔ SFO (3:22 PM)."

const best2 = "Air Premia/Air Seoul/ZIPAIR/Frontier ($903): SFO (5:00 PM, Jul 13) ➔ NRT (11:50 AM, +2 days) [Self transfer | 11h 40m layover in ICN]; Return: NRT (7:35 PM, Aug 11) ➔ SFO (8:40 PM) [Self transfer | 5h 12m layover in LAx]."


const planResponse = await model.invoke(
    `You are a helpful trip budget advisor. My goal is to find the cheapest round-trip flight to Japan from the San Francisco Bay Area.
Please adhere to the following strict constraints and preferences: 
1. Origin Airports: Include San Francisco International (SFO), Oakland International (OAK), and San Jose Mineta International (SJC).
2. Travel Dates & Duration: 
   - The trip must take place roughly between July 5th and August 16th (with some leeway in either direction). 
   - The minimum vacation duration is 2 weeks.
   - Optimize for the best "days spent to money spent" ratio (maximizing vacation days per dollar spent).
3. Passengers & Baggage:
   - Total of 2 passengers.
   - Each passenger requires 1 carry-on bag and 1 checked bag. 
   - If bags are not included in the base fare, calculate and include the additional baggage fees in the total cost.
4. Discounts: I am a college student, so include student discounts if eligible.
5. Layovers & Transfers: 
   - There is no limit on layover duration, provided the total transit time per direction is under 30 hours.
   - Self-transfers are valid. Consider common layover hubs such as Seoul (ICN), Taiwan (TPE), Honolulu (HNL), etc. but they will have to ultimately take me to Japan.
6. Budget & Exclusions: 
   - Maximum budget is $1,200 per ticket. Completely ignore any options above this price.
   - Do not include hotel costs in the total.

Currently, the best options I have found are ${best1} and ${best2}.

Produce a JSON array of potential flight paths where the total travel time per way is less than 30 hours. Respond ONLY with valid JSON and absolutely no conversational explanation. 

Example format:
[
  {
    "route": "SFO -> KIX",
    "departure date": "July 13",
    "return date":"August 11"
    "estimated_time": "13 hours",
    "airline": "Air Canada",
    "layover": "No layover",
    "baggage": "checked bag included ? additional checked bag cost : checked bag is included"
  }
]
If there is any other information you think would be helpful please include it in this arry  
`
);


// Step 2: Parse the plan
const cleanJsonString = planResponse.content.replace(/```json|```/g, '').trim();
const showRoutes = JSON.parse(cleanJsonString);

// Step 3: Execute each step
const results = [];
for (const route of showRoutes) {
    const result = await model.invoke(
        `Using the internet and ticket prices find the cheapest option for this route and add instructions on where and how to book this flight and keep the json information: ${JSON.stringify(route)} and show me the TOTAL PRICE for every ticket factoring in layover and transfers`
    );
    
    results.push(result.content);
}

const summary = await model.invoke(`Show the ten cheapest options based on this ${results}, in order of cheapest to most expensive and give a summary of the findings`)

// Step 4: Combine into a final result
console.log(summary.content);