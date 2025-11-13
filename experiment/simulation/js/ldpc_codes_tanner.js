// select a random H matrix
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
function getGeneratorMatrix(H) {
    const rows = H.length;
    const cols = H[0].length;
    const rank = gaussianElimination(H);

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

    // Generate the generator matrix from the selected parity check matrix
    const G = getGeneratorMatrix(H);

    console.log("This works successfully");
    // Return the generator and parity check matrices
    return {
        generatorMatrix: G,
        parityCheckMatrix: H,
    };
}

// SVG dimensions
const width = 600;
const height = 400;
const nodeRadius = 10;
const bitXShiftLabel = 102;
const checkXShiftLabel = -10;
const yLabelShift = -10;
//direction choosen at random
let currentDirection = Math.random() < 0.5 ? 'right-to-left' : 'left-to-right';

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
    signal: receivedWord.signal[j],
    llr: receivedWord.llr[j],
    hardDecision: receivedWord.hardDecision[j],
    label: `x${j}: ${formatLLR(receivedWord.llr[j])}` // Show LLR value instead of bit value
}));

// Create check nodes with initial zero syndrome values
let checkNodes = H.map((_, i) => ({
    id: "z" + i,
    type: "z",
    x: checkNodeStartX,
    y: i * checkNodeSpacingY + verticalOffset,
    syndrome: 0,
    label: `z${i}: 0` // Initial syndrome value
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
    .selectAll("g") // SelectAll placeholder
    .data(nodes)
    .enter()
    .append(d => document.createElementNS("http://www.w3.org/2000/svg", d.type === "x" ? "circle" : "rect"))
    .attr("id", d => d.id) // <-- FIXED: Added ID for selection
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
    .attr("id", d => d.id) // Note: This ID is on the <foreignObject>
    .attr("width", 110) // Increased width for longer LLR values
    .attr("height", 30)
    .append("xhtml:div")
    .style("font-size", "15px")
    .html(d => {
        if (d.type === "x") {
            return `\\(x_{${d.id.slice(1)}}: ${formatLLR(d.llr)}\\)`;
        }
        if (d.type === "z") {
            return `\\(z_{${d.id.slice(1)}}: ${d.syndrome}\\)`;
        }
        return d.label;
    });

// Update check nodes to calculate syndromes based on hard decisions
function updateCheckNodeSyndromes() {
    checkNodes.forEach((checkNode, i) => {
        let syndrome = 0;
        H[i].forEach((val, j) => {
            if (val === 1) {
                syndrome = (syndrome + bitNodes[j].hardDecision) % 2;
            }
        });

        checkNode.syndrome = syndrome;

        // Update the label in the DOM
        const labelElement = svg.select(`foreignObject#${checkNode.id}`)
            .select("div");

        if (labelElement.node()) {
            labelElement.html(() => {
                return `\\(z_{${checkNode.id.slice(1)}}: ${checkNode.syndrome}\\)`;
            });
        }
    });
}

// Call this function initially
updateCheckNodeSyndromes();

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
        .attr("y", d.y + yLabelShift)
        .attr("html", d.html);

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

function insertUnderscore(str) {
    return str[0] + '_' + str.slice(1);
}

// Function to generate messages for the AWGN channel
function generateAWGNMessages() {
    let messages = [];

    // For AWGN, we use the sum-product algorithm
    // Each check node sends a message to each bit node it's connected to

    // Phase 1: Variable nodes to check nodes
    if (currentDirection === 'left-to-right') {
        bitNodes.forEach(bitNode => {
            // Find connected check nodes
            const connectedLinks = links.filter(link => link.source === bitNode.id);

            connectedLinks.forEach(link => {
                const checkNode = checkNodes.find(n => n.id === link.target);

                // In AWGN, we send the LLR directly in the first round
                messages.push({
                    from: bitNode.id,
                    to: checkNode.id,
                    message: `\\(\\mu_{${insertUnderscore(bitNode.id)}\\to ${insertUnderscore(checkNode.id)}} = ${formatLLR(bitNode.llr)}\\)`,
                    value: bitNode.llr
                });
            });
        });

        currentDirection = 'right-to-left';
    }
    // Phase 2: Check nodes to variable nodes
    else {
        checkNodes.forEach(checkNode => {
            // Find connected bit nodes
            const connectedLinks = links.filter(link => link.target === checkNode.id);

            connectedLinks.forEach(link => {
                const bitNode = bitNodes.find(n => n.id === link.source);

                // Calculate the extrinsic information (product of tanh of other inputs)
                let product = 1;
                connectedLinks.forEach(otherLink => {
                    if (otherLink.source !== link.source) {
                        const otherBitNode = bitNodes.find(n => n.id === otherLink.source);
                        // Use tanh(LLR/2) for check node processing
                        product *= Math.tanh(otherBitNode.llr / 2);
                    }
                });

                // Convert back to LLR domain
                const newLLR = 2 * Math.atanh(product);
                const formattedLLR = formatLLR(newLLR);

                messages.push({
                    from: checkNode.id,
                    to: bitNode.id,
                    message: `\\(\\mu_{${insertUnderscore(checkNode.id)}\\to ${insertUnderscore(bitNode.id)}} = ${formattedLLR}\\)`,
                    value: newLLR
                });
            });
        });

        currentDirection = 'left-to-right';
    }

    return {
        found: messages.length > 0,
        messages: messages
    };
}

// Function to update bit node LLRs based on incoming messages
function updateBitNodeLLRs(messages) {
    // Group messages by destination bit node
    const messagesByBitNode = {};

    messages.forEach(msg => {
        const bitNodeId = msg.to;
        if (bitNodeId.startsWith('x')) {
            if (!messagesByBitNode[bitNodeId]) {
                messagesByBitNode[bitNodeId] = [];
            }
            messagesByBitNode[bitNodeId].push(msg.value);
        }
    });

    // Update each bit node's LLR
    Object.keys(messagesByBitNode).forEach(bitNodeId => {
        const bitNode = bitNodes.find(n => n.id === bitNodeId);
        const incomingLLRs = messagesByBitNode[bitNodeId];

        // For AWGN, we sum the incoming LLRs with the channel LLR
        let newLLR = receivedWord.llr[parseInt(bitNodeId.slice(1))]; // Channel LLR
        incomingLLRs.forEach(llr => {
            newLLR += llr;
        });

        // Update bit node LLR and hard decision
        bitNode.llr = newLLR;
        bitNode.hardDecision = newLLR > 0 ? 0 : 1;

        // Update label
        const labelElement = svg.select(`foreignObject#${bitNodeId}`).select("div");
        if (labelElement.node()) {
            labelElement.html(`\\(x_{${bitNodeId.slice(1)}}: ${formatLLR(bitNode.llr)}\\)`);
        }

        // Update node color based on new LLR
        // FIXED: Selector now works because nodes have IDs
        const nodeElement = svg.select(`.nodes circle[id='${bitNodeId}']`);
        const intensity = Math.min(255, 100 + Math.abs(bitNode.llr) * 20);
        nodeElement.attr("fill", bitNode.llr > 0 ? `rgb(0, 0, ${intensity})` : `rgb(${intensity}, 0, 0)`);
    });

    // Update check node syndromes based on new hard decisions
    updateCheckNodeSyndromes();
}

function generateMessageQuiz() {
    // Select a random source and destination for the quiz
    let sourceNode, destinationNode;

    if (currentDirection === 'left-to-right') {
        // Bit node to check node
        sourceNode = bitNodes[Math.floor(Math.random() * bitNodes.length)];

        // Find connected check nodes to this bit node
        const connectedCheckNodes = [];
        links.forEach(link => {
            if (link.source === sourceNode.id) {
                connectedCheckNodes.push(checkNodes.find(n => n.id === link.target));
            }
        });

        if (connectedCheckNodes.length === 0) {
            // Fallback if no connections found
            destinationNode = checkNodes[Math.floor(Math.random() * checkNodes.length)];
        } else {
            destinationNode = connectedCheckNodes[Math.floor(Math.random() * connectedCheckNodes.length)];
        }
    } else {
        // Check node to bit node
        sourceNode = checkNodes[Math.floor(Math.random() * checkNodes.length)];

        // Find connected bit nodes to this check node
        const connectedBitNodes = [];
        links.forEach(link => {
            if (link.target === sourceNode.id) {
                connectedBitNodes.push(bitNodes.find(n => n.id === link.source));
            }
        });

        if (connectedBitNodes.length === 0) {
            // Fallback if no connections found
            destinationNode = bitNodes[Math.floor(Math.random() * bitNodes.length)];
        } else {
            destinationNode = connectedBitNodes[Math.floor(Math.random() * connectedBitNodes.length)];
        }
    }

    // Generate the correct message value
    let correctMessageValue;

    if (currentDirection === 'left-to-right') {
        // Bit node to check node: send LLR
        correctMessageValue = sourceNode.llr;
    } else {
        // Check node to bit node: calculate using tanh product formula
        // Find all connected bit nodes to this check node except the destination
        const connectedBitNodes = [];
        links.forEach(link => {
            if (link.target === sourceNode.id && link.source !== destinationNode.id) {
                connectedBitNodes.push(bitNodes.find(n => n.id === link.source));
            }
        });

        // Calculate product of tanh(LLR/2)
        let product = 1;
        connectedBitNodes.forEach(bitNode => {
            product *= Math.tanh(bitNode.llr / 2);
        });

        // Convert back to LLR domain
        correctMessageValue = 2 * Math.atanh(product);
    }

    // Format the question text
    const questionElement = document.getElementById("tannerQuestion");
    if (questionElement) {
        questionElement.innerHTML = `What message will be sent from ${sourceNode.id} to ${destinationNode.id} in this round?`;
    }

    return {
        sourceNode: sourceNode,
        destinationNode: destinationNode,
        correctMessageValue: correctMessageValue
    };
}

// Function to generate message options for the quiz
function generateMessageOptions() {
    // Get the form element
    const form = document.getElementById('form1');
    form.innerHTML = '';

    // Generate the quiz question with source and destination nodes
    const quiz = generateMessageQuiz();
    const { sourceNode, destinationNode, correctMessageValue } = quiz;

    // Generate four options
    const options = [];

    // Option 1: Correct message
    options.push({
        id: 'correct',
        value: correctMessageValue,
        message: `\\(\\mu_{${insertUnderscore(sourceNode.id)}\\to ${insertUnderscore(destinationNode.id)}} = ${formatLLR(correctMessageValue)}\\)`
    });

    // Option 2: Reversed sign (opposite direction)
    options.push({
        id: 'wrong-sign',
        value: -correctMessageValue,
        message: `\\(\\mu_{${insertUnderscore(sourceNode.id)}\\to ${insertUnderscore(destinationNode.id)}} = ${formatLLR(-correctMessageValue)}\\)`
    });

    // Option 3: Scaled value (too large)
    options.push({
        id: 'wrong-scale',
        value: correctMessageValue * 2,
        message: `\\(\\mu_{${insertUnderscore(sourceNode.id)}\\to ${insertUnderscore(destinationNode.id)}} = ${formatLLR(correctMessageValue * 2)}\\)`
    });

    // Option 4: Random value
    let randomValue;
    do {
        randomValue = (Math.random() * 6) - 3; // Random value between -3 and 3
    } while (Math.abs(randomValue - correctMessageValue) < 0.5); // Ensure it's different enough

    options.push({
        id: 'wrong-random',
        value: randomValue,
        message: `\\(\\mu_{${insertUnderscore(sourceNode.id)}\\to ${insertUnderscore(destinationNode.id)}} = ${formatLLR(randomValue)}\\)`
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
    form.dataset.sourceId = sourceNode.id;
    form.dataset.destinationId = destinationNode.id;

}

// Update the NextRound function to work with single message
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
        observation.innerHTML = "Correct! Move on to next exercise ....";
        observation.style.color = "green";

    } else {
        observation.innerHTML = "Incorrect! Try again by considering how messages are calculated in the sum-product algorithm.";
        observation.style.color = "red";
    }
}

// Add this new function to update node labels
function updateNodeLabels() {
    labels.html(d => {
        if (d.type === "x") {
            return `\\(x_{${d.id.slice(1)}}: ${formatLLR(d.llr)}\\)`;
        }
        if (d.type === "z") {
            return `\\(z_{${d.id.slice(1)}}: ${d.syndrome}\\)`;
        }
        return d.label;
    });
}
// Function to check if decoding is complete (all syndromes zero)
function checkDecodingStatus() {
    const allSyndromesZero = checkNodes.every(node => node.syndrome === 0);

    if (allSyndromesZero) {
        const decodedDisplay = document.getElementById("decodingStatus");
        if (decodedDisplay) {
            decodedDisplay.innerHTML = "Decoding complete! All syndromes are zero.";
            decodedDisplay.style.color = "green";
        }

        // Show the decoded codeword
        displayDecodedWord();
    }
}

// Function to display the decoded codeword
function displayDecodedWord() {
    const decodedWord = bitNodes.map(node => node.hardDecision);

    const decodedDisplay = document.getElementById("decodedWord");
    if (decodedDisplay) {
        decodedDisplay.innerHTML = `Decoded codeword: ${decodedWord.join('')}`;
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Initialize the graph with first round of message passing options
const initialMessages = generateAWGNMessages();
generateMessageOptions(initialMessages);