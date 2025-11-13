// Add tracking variables
let currentRound = 0;

const predefinedParityCheckMatrices = [
    {
        H: [
            [1, 0, 1, 1, 0, 1],
            [0, 1, 0, 0, 0, 1],
            [0, 0, 1, 0, 1, 0],
        ],
        k: 3,
        n: 6,
    },
    {
        H: [
            [1, 0, 0, 0, 0, 1],
            [0, 1, 1, 0, 1, 0],
            [1, 0, 0, 1, 0, 0],
        ],
        k: 3,
        n: 6,
    },
    {
        H: [
            [1, 1, 1, 0, 0, 0],
            [0, 1, 0, 1, 0, 1],
            [0, 0, 1, 0, 1, 0],
        ],
        k: 3,
        n: 6,
    },
];

// Configuration for AWGN channel
const snrDb = 2.0; // Signal-to-noise ratio in dB
const snr = Math.pow(10, snrDb / 10); // Convert SNR from dB to linear scale
const sigma = Math.sqrt(1 / (2 * snr)); // Standard deviation of noise

const GH = generateLDPCMatrices();
const G = GH.generatorMatrix;
const H = GH.parityCheckMatrix;

console.log("H matrix:", H);
console.log("G matrix:", G);

// Function to compute the generator matrix from a given parity check matrix
function getGeneratorMatrix(H_matrix) { // Renamed param to avoid shadowing
    // --- FIX ---
    // Create a deep copy of H to avoid modifying the original matrix,
    // which is needed later for building the Tanner graph.
    const H = H_matrix.map(row => [...row]);

    const rows = H.length;
    const cols = H[0].length;
    const rank = gaussianElimination(H); // H is modified in-place here

    const k = cols - rank;
    const pivotColumns = new Set();
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (H[i][j] === 1) {
                pivotColumns.add(j);
                break;
            }
        }
    }

    const freeColumns = [];
    for (let j = 0; j < cols; j++) {
        if (!pivotColumns.has(j)) {
            freeColumns.push(j);
        }
    }

    let G = new Array(k).fill(0).map(() => new Array(cols).fill(0));

    for (let i = 0; i < k; i++) {
        G[i][freeColumns[i]] = 1;
        for (let j = 0; j < rank; j++) {
            let pivotCol = Array.from(pivotColumns)[j];
            G[i][pivotCol] = H[j][freeColumns[i]];
        }
    }

    return G;
}

function gaussianElimination(H) {
    let rows = H.length, cols = H[0].length;
    let rank = 0, row = 0;
    
    for (let col = 0; col < cols && row < rows; col++) {
        let pivotRow = row;
        while (pivotRow < rows && H[pivotRow][col] === 0) {
            pivotRow++;
        }
        
        if (pivotRow === rows) continue;
        
        [H[row], H[pivotRow]] = [H[pivotRow], H[row]];
        
        for (let i = row + 1; i < rows; i++) {
            if (H[i][col] === 1) {
                for (let j = 0; j < cols; j++) {
                    H[i][j] ^= H[row][j];
                }
            }
        }
        
        rank++;
        row++;
    }
    return rank;
}

// Main function to generate LDPC code matrices
function generateLDPCMatrices() {
    const randomIndex = Math.floor(Math.random() * predefinedParityCheckMatrices.length);
    const { H, k, n } = predefinedParityCheckMatrices[randomIndex];

    const G = getGeneratorMatrix(H);

    console.log("This works successfully");
    // Return the generator and parity check matrices
    return {
        generatorMatrix: G,
        parityCheckMatrix: H, // This is now the *original* H, not the modified one
    };
}

// SVG dimensions
const width = 600;
const height = 400;
const nodeRadius = 10;
const bitXShiftLabel = 110;
const checkXShiftLabel = -10;
const yLabelShift = -10;

// Append an SVG element to the #sentCodeword element
const svg = d3.select("#tannerGraph")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Define layout variables
const bitNodeStartX = 100;
const bitNodeSpacingY = 80;
const checkNodeStartX = 500;
const checkNodeSpacingY = 100;
const verticalOffset = 50;

// Modified node generation
let message = generateRandomMessage(G.length); // Generate random message of length k
let codeword = encodeMessage(message, G); // Generate valid codeword
let receivedWord = transmitThroughAWGN(codeword); // Transmit through AWGN channel

// Function to generate a random message vector of length k
function generateRandomMessage(k) {
    return Array.from({ length: k }, () => Math.floor(Math.random() * 2));
}

// Function to encode a message using generator matrix G
function encodeMessage(message, G) {
    // Multiply message vector by generator matrix
    const n = G[0].length;
    const codeword = new Array(n).fill(0);

    for (let j = 0; j < n; j++) {
        for (let i = 0; i < message.length; i++) {
            codeword[j] = (codeword[j] + message[i] * G[i][j]) % 2;
        }
    }

    return codeword;
}

// Function to transmit codeword through AWGN channel
function transmitThroughAWGN(codeword) {
    // BPSK modulation: 0 -> +1, 1 -> -1
    const modulatedSignal = codeword.map(bit => bit === 0 ? 1 : -1);
    
    // Add Gaussian noise
    const receivedSignal = modulatedSignal.map(symbol => {
        const noise = gaussian(0, sigma);
        return symbol + noise;
    });
    
    // Convert received signals to LLRs (Log-Likelihood Ratios)
    // LLR = log(P(bit=0|y) / P(bit=1|y)) = 2y/sigma^2 for AWGN channel with BPSK
    const llrs = receivedSignal.map(y => 2 * y / (sigma * sigma));
    
    // Create an object with both the received signals and their LLRs
    return {
        signal: receivedSignal,
        llr: llrs,
        // Add hard decisions for visualization purposes
        hardDecision: llrs.map(llr => llr > 0 ? 0 : 1)
    };
}

// Helper function to generate Gaussian random numbers using Box-Muller transform
function gaussian(mean, stdDev) {
    const u1 = Math.random();
    const u2 = Math.random();
    
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    
    return mean + z0 * stdDev;
}

// Function to format LLR values for display
function formatLLR(llr) {
    return llr.toFixed(2);
}

// Create bit nodes with LLR values
let bitNodes = H[0].map((_, j) => ({
    id: "x" + j,
    type: "x",
    x: bitNodeStartX,
    y: j * bitNodeSpacingY + verticalOffset,
    peeled: false,
    signal: receivedWord.signal[j],
    llr: receivedWord.llr[j],
    hardDecision: receivedWord.hardDecision[j],
}));

// Create check nodes with initial zero syndrome values
let checkNodes = H.map((_, i) => ({
    id: "z" + i,
    type: "z",
    x: checkNodeStartX,
    y: i * checkNodeSpacingY + verticalOffset,
    peeled: false,
    syndrome: 0,
}));

let nodes = [...bitNodes, ...checkNodes];

// Create links (edges) between bits and checks based on H matrix
let links = [];
H.forEach((row, i) => {
    row.forEach((val, j) => {
        if (val === 1) {
            links.push({ 
                source: "x" + j, 
                target: "z" + i,
            });
        }
    });
});

let link = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .enter().append("line")
    .attr("stroke-width", 2)
    .attr("stroke", "#999");

// Update the links function to maintain the styling
function updateLinks() {
    link
        .attr("x1", d => bitNodes.find(n => n.id === d.source).x)
        .attr("y1", d => bitNodes.find(n => n.id === d.source).y)
        .attr("x2", d => checkNodes.find(n => n.id === d.target).x)
        .attr("y2", d => checkNodes.find(n => n.id === d.target).y);
}

// Add the nodes to the SVG with color based on LLR values
let node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append(d => document.createElementNS("http://www.w3.org/2000/svg", d.type === "x" ? "circle" : "rect"))
    .attr("r", d => d.type === "x" ? nodeRadius : null) // Only circles get radius
    .attr("width", d => d.type === "z" ? nodeRadius * 2 : null) // Width for squares
    .attr("height", d => d.type === "z" ? nodeRadius * 2 : null) // Height for squares
    .attr("fill", d => {
        if (d.type === "x") {
            return "blue"
        } else {
            return "green"; // Check nodes remain green
        }
    })
    .attr("cx", d => d.type === "x" ? d.x : null)
    .attr("cy", d => d.type === "x" ? d.y : null)
    .attr("x", d => d.type === "z" ? d.x - nodeRadius : null) // Center squares
    .attr("y", d => d.type === "z" ? d.y - nodeRadius : null) // Center squares
    .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );

// Update labels to show LLR values instead of binary values
let labels = svg.append("g")
    .attr("class", "labels")
    .selectAll("foreignObject")
    .data(nodes)
    .enter()
    .append("foreignObject")
    .attr("x", d => d.type === "x" ? d.x - nodeRadius - bitXShiftLabel : d.x + nodeRadius + checkXShiftLabel)
    .attr("y", d => d.y + yLabelShift)
    .attr("id", d => d.id) // This ID is used to select the label for updates
    .attr("width", 120) // Increased width for longer LLR values
    .attr("height", 30)
    .append("xhtml:div")
    .style("font-size", "15px")
    .html(d => {
        if (d.type === "x") {
            return `\\(x_{${d.id.slice(1)}}: ${formatLLR(d.llr)}\\)`;
        }
        if(d.type === "z"){
            return `\\(z_{${d.id.slice(1)}}: ${d.syndrome}\\)`;
        }
    });


// Drag behavior functions
function dragstarted(event, d) {
    if (!event.active) {
        d3.select(this).raise().attr("stroke", "black");
    }
}

// Update the dragged function to maintain label positions
function dragged(event, d) {
    d.x = event.x;
    d.y = event.y;

    // Update node positions
    d3.select(this)
        .attr("cx", d.type === "x" ? d.x : null)
        .attr("cy", d.type === "x" ? d.y : null)
        .attr("x", d.type === "z" ? d.x - nodeRadius : null)
        .attr("y", d.type === "z" ? d.y - nodeRadius : null);

    // Update labels positions
    labels.filter(l => l.id === d.id)
        .attr("x", d.type === "x" ? d.x - nodeRadius - bitXShiftLabel : d.x + nodeRadius + checkXShiftLabel)
        .attr("y", d.y + yLabelShift);

    updateLinks();
}

function dragended(event, d) {
    d3.select(this).attr("stroke", null);
}

// Function to adjust SVG size to fit the updated graph
function adjustSVGSize() {
    const xValues = nodes.map(d => d.x);
    const yValues = nodes.map(d => d.y);

    const minX = Math.min(...xValues) - nodeRadius;
    const maxX = Math.max(...xValues) + nodeRadius;
    const minY = Math.min(...yValues) - nodeRadius;
    const maxY = Math.max(...yValues) + nodeRadius;

    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;

    const newWidth = Math.max(graphWidth, width);
    const newHeight = Math.max(graphHeight, height);

    const offsetX = (newWidth - graphWidth) / 2;
    const offsetY = (newHeight - graphHeight) / 2;

    svg.attr("width", newWidth).attr("height", newHeight);
    svg.attr("viewBox", `${minX - offsetX} ${minY - offsetY} ${newWidth} ${newHeight}`);
}

// Initial call to update links based on static positions
updateLinks();
adjustSVGSize();

// Function to generate message options for the quiz
function generateMessageOptions() {
    // Get the form element
    const form = document.getElementById('form1');
    form.innerHTML = '';
    
    // Generate four options for message passing values
    const options = [];
    
    // Option 1: Correct message (from sum-product algorithm)
    options.push({
        id: 'correct',
        message: codeword
    });
    
    // Option 2: Value with wrong sign
    options.push({
        id: 'wrong-sign',
        message: codeword.map(bit => bit === 0 ? 1 : 0)
    });
    
    // Option 3: Value with one random bit flipped
    options.push({
        id: 'wrong-one-bit',
        message: (() => {
            const flippedCodeword = [...codeword];
            const bitToFlip = Math.floor(Math.random() * codeword.length);
            flippedCodeword[bitToFlip] = flippedCodeword[bitToFlip] === 0 ? 1 : 0;
            return flippedCodeword;
        })()
    });

    // Option 4: Value with multiple random bits flipped
    options.push({
        id: 'wrong-multiple-bits',
        message: (() => {
            const flippedCodeword = [...codeword];
            const numBitsToFlip = Math.floor(Math.random() * 2) + 2;
            const positions = new Set();
            
            while (positions.size < numBitsToFlip) {
                positions.add(Math.floor(Math.random() * codeword.length));
            }
            
            positions.forEach(pos => {
                flippedCodeword[pos] = flippedCodeword[pos] === 0 ? 1 : 0;
            });
            
            return flippedCodeword;
        })()
    });
    
    // Shuffle and display options
    const shuffledOptions = shuffleArray(options);
    shuffledOptions.forEach((option, index) => {
        const div = document.createElement('div');
        div.className = 'option';
        div.style.paddingTop = '0.4em';
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'message-value';
        radio.id = option.id;
        radio.value = index;
        
        const label = document.createElement('label');
        label.htmlFor = option.id;
        label.innerHTML = option.message;
        
        div.appendChild(radio);
        div.appendChild(label);
        form.appendChild(div);
    });
    
    // Store the correct answer for checking later
    form.dataset.correctId = 'correct';
}


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function NextRound() {
    const observation = document.getElementById("tannerQuestionObservation");
    const form = document.getElementById('form1');
    const selectedOption = Array.from(form.elements).find(el => el.checked);

    if (!selectedOption) {
        observation.innerHTML = "Please select an option before proceeding.";
        observation.style.color = "red";
        return;
    }

    // Check if the selected option is correct
    if (selectedOption.id === form.dataset.correctId) {
        observation.innerHTML = "Congratulations! The bit MAP estimate is correct.";
        observation.style.color = "green";
        currentRound++;

        // Update round counter display if it exists
        const roundDisplay = document.getElementById("roundCounter");
        if (roundDisplay) {
            roundDisplay.innerHTML = `Round: ${currentRound}`;
        }

        // Update received signals and LLRs
        receivedWord = transmitThroughAWGN(codeword);

        // Update bit nodes with new LLRs
        bitNodes.forEach((node, i) => {
            node.signal = receivedWord.signal[i];
            node.llr = receivedWord.llr[i];
            node.hardDecision = receivedWord.hardDecision[i];
        });

        // Update node colors and labels
        node.attr("fill", d => {
            if (d.type === "x") {
                const intensity = 255;
                return d.llr > 0 ? `rgb(0, 0, ${intensity})` : `rgb(${intensity}, 0, 0)`;
            }
            return "green";
        });

        // Update labels
        // --- FIX ---
        // Changed `labels.html` to `labels.select("div").html`
        // to correctly target the child div that contains the text.
        labels.select("div").html(d => {
            if (d.type === "x") {
                return `\\(x_{${d.id.slice(1)}}: ${formatLLR(d.llr)}\\)`;
            }
            if (d.type === "z") {
                // Note: check node syndrome is not recalculated here,
                // it will remain 0.
                return `\\(z_{${d.id.slice(1)}}: ${d.syndrome}\\)`;
            }
            return d.label; // Should not be reached
        });

        // Re-render MathJax expressions
        if (window.MathJax) {
            MathJax.typesetClear();
            MathJax.typesetPromise().then(() => {
                updateLinks();
                adjustSVGSize();
            });
        }

    } else {
        observation.innerHTML = "Incorrect! Try again by considering the received signals and channel characteristics.";
        observation.style.color = "red";
    }
}

generateMessageOptions();