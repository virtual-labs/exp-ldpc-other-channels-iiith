// select a random H matrix

const rows = Math.floor(Math.random() * 3) + 3;
const cols = Math.floor(Math.random() * 3) + rows + 1;
const rate = Math.random() * 0.5 + 0.25;

// const { setOfH, correctOption } = generateParityCheckMatrixOptions(rows, cols);
// // const correctOption = Math.floor(Math.random() * setOfH.length);
// const H = setOfH[correctOption];
// const G = generateGeneratorMatrix(H);

// Add tracking variables
let currentRound = 0;

const predefinedParityCheckMatrices = [
    {
        H: [
            [1, 1, 0, 1, 1, 0, 0],
            [1, 0, 1, 0, 0, 1, 0],
            [0, 1, 1, 1, 0, 0, 1],
        ],
        k: 4,
        n: 7,
    },
    {
        H: [
            [1, 0, 1, 1, 1, 0, 0],
            [0, 1, 1, 0, 0, 1, 0],
            [1, 1, 0, 0, 0, 0, 1],
        ],
        k: 4,
        n: 7,
    },
    {
        H: [
            [0, 1, 1, 0, 1, 0, 0],
            [1, 0, 1, 1, 0, 1, 0],
            [1, 1, 0, 0, 0, 0, 1],
        ],
        k: 4,
        n: 7,
    },
    {
        H: [
            [1, 0, 0, 1, 1, 0, 0],
            [0, 1, 0, 1, 0, 1, 0],
            [1, 1, 1, 0, 0, 0, 1],
        ],
        k: 4,
        n: 7,
    },
];



const GH = generateLDPCMatrices();
const G = GH.generatorMatrix;
const H = GH.parityCheckMatrix;

console.log("H matrix:", generateLDPCMatrices());
console.log("G matrix:", G);


// // Generate a random binary matrix with specified dimensions
// function generateRandomBinaryMatrix(rows, cols) {
//     return Array.from({ length: rows }, () =>
//         Array.from({ length: cols }, () => Math.floor(Math.random() * 2))
//     );
// }

// // Make matrix full rank using Gaussian elimination
// function makeFullRank(matrix) {
//     const rows = matrix.length;
//     const cols = matrix[0].length;
//     let rank = 0;
//     let tempMatrix = matrix.map(row => [...row]);

//     for (let col = 0; col < cols && rank < rows; col++) {
//         // Find pivot
//         let pivotRow = -1;
//         for (let row = rank; row < rows; row++) {
//             if (tempMatrix[row][col] === 1) {
//                 pivotRow = row;
//                 break;
//             }
//         }

//         if (pivotRow === -1) continue;

//         // Swap rows if necessary
//         if (pivotRow !== rank) {
//             [tempMatrix[rank], tempMatrix[pivotRow]] = [tempMatrix[pivotRow], tempMatrix[rank]];
//         }

//         // Eliminate below
//         for (let row = rank + 1; row < rows; row++) {
//             if (tempMatrix[row][col] === 1) {
//                 for (let c = col; c < cols; c++) {
//                     tempMatrix[row][c] = (tempMatrix[row][c] + tempMatrix[rank][c]) % 2;
//                 }
//             }
//         }

//         rank++;
//     }

//     return { matrix: tempMatrix, rank };
// }

// // Generate a systematic generator matrix G
// function generateSystematicGeneratorMatrix(k, n) {
//     if (k >= n) throw new Error("k must be less than n for valid LDPC code");

//     // Start with random binary matrix
//     let G = generateRandomBinaryMatrix(k, n);

//     // Make it full rank
//     const { matrix, rank } = makeFullRank(G);
//     if (rank < k) {
//         // If not full rank, try again
//         return generateSystematicGeneratorMatrix(k, n);
//     }
//     G = matrix;

//     // Convert to systematic form [I|P]
//     for (let i = 0; i < k; i++) {
//         // Make diagonal 1
//         if (G[i][i] === 0) {
//             for (let j = i + 1; j < k; j++) {
//                 if (G[j][i] === 1) {
//                     for (let col = 0; col < n; col++) {
//                         G[i][col] = (G[i][col] + G[j][col]) % 2;
//                     }
//                     break;
//                 }
//             }
//         }

//         // Clear column above and below
//         for (let j = 0; j < k; j++) {
//             if (i !== j && G[j][i] === 1) {
//                 for (let col = 0; col < n; col++) {
//                     G[j][col] = (G[j][col] + G[i][col]) % 2;
//                 }
//             }
//         }
//     }

//     return G;
// }

// // Generate parity check matrix H from generator matrix G
// function generateParityCheckMatrix(G) {
//     const k = G.length;
//     const n = G[0].length;
//     const r = n - k;  // number of parity check equations

//     // Extract P matrix from G = [I|P]
//     const P = G.map(row => row.slice(k));

//     // Create H = [-P^T|I]
//     const H = Array(r).fill().map(() => Array(n).fill(0));

//     // Fill -P^T part (in binary field, -P^T = P^T)
//     for (let i = 0; i < r; i++) {
//         for (let j = 0; j < k; j++) {
//             H[i][j] = P[j][i];
//         }
//     }

//     // Fill identity matrix part
//     for (let i = 0; i < r; i++) {
//         H[i][k + i] = 1;
//     }

//     return H;
// }

// // Make H matrix LDPC-like by ensuring low density
// function makeLDPC(H, targetDensity = 0.1) {
//     const rows = H.length;
//     const cols = H[0].length;
//     const ldpcH = H.map(row => [...row]);

//     // Calculate current density
//     const currentOnes = ldpcH.flat().reduce((sum, val) => sum + val, 0);
//     const currentDensity = currentOnes / (rows * cols);

//     if (currentDensity > targetDensity) {
//         // Randomly remove 1s until target density is reached
//         while (ldpcH.flat().reduce((sum, val) => sum + val, 0) / (rows * cols) > targetDensity) {
//             const row = Math.floor(Math.random() * rows);
//             const col = Math.floor(Math.random() * cols);
//             if (ldpcH[row][col] === 1) {
//                 // Ensure we maintain rank by checking if removing this 1 would break rank
//                 const tempH = ldpcH.map(row => [...row]);
//                 tempH[row][col] = 0;
//                 const { rank } = makeFullRank(tempH);
//                 if (rank === rows) {
//                     ldpcH[row][col] = 0;
//                 }
//             }
//         }
//     }

//     return ldpcH;
// }


// Function to compute the generator matrix from a given parity check matrix
function getGeneratorMatrix(H, k, n) {
    const rows = H.length;
    const cols = H[0].length;

    // Verify the input matrix is systematic
    const PTranspose = H.map(row => row.slice(0, k));
    const identity = H.map(row => row.slice(k));
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < rows; j++) {
            if (identity[i][j] !== (i === j ? 1 : 0)) {
                throw new Error("Input parity check matrix is not in systematic form.");
            }
        }
    }

    // Transpose PTranspose to get P
    const P = Array.from({ length: k }, (_, i) =>
        Array.from({ length: rows }, (_, j) => PTranspose[j][i])
    );

    // Construct G = [I_k | P]
    const identityK = Array.from({ length: k }, (_, i) =>
        Array.from({ length: k }, (_, j) => (i === j ? 1 : 0))
    );
    return identityK.map((row, i) => [...row, ...P[i]]);
}

// Main function to generate LDPC code matrices
function generateLDPCMatrices() {
    const randomIndex = Math.floor(Math.random() * predefinedParityCheckMatrices.length);
    const { H, k, n } = predefinedParityCheckMatrices[randomIndex];

    // Generate the generator matrix from the selected parity check matrix
    const G = getGeneratorMatrix(H, k, n);

    console.log("This works succesfully");
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
const bitXShiftLabel = 100;
const checkXShiftLabel = 15;
const yLabelShift = -10;
// Add this at the beginning of your code
let currentDirection = 'left-to-right';

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
let receivedWord = introduceErrors(codeword); // Introduce some erasures

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

// Function to introduce errors into codeword

function introduceErrors(codeword, errorRate = 0.3) {
    const corrupted = codeword.map(bit => {
        // Randomly flip some bits to '?' based on error rate
        return Math.random() < errorRate ? '?' : bit.toString();
    });

    // Ensure at least one error by flipping a random bit if no errors exist
    if (!corrupted.includes('?')) {
        const randomIndex = Math.floor(Math.random() * codeword.length);
        corrupted[randomIndex] = '?';
    }

    return corrupted;
}

let bitNodes = H[0].map((_, j) => ({
    id: "x" + j,
    type: "x",
    x: bitNodeStartX,
    y: j * bitNodeSpacingY + verticalOffset,
    peeled: false,
    value: receivedWord[j], // Use value from received word
    label: `x${j}: ${receivedWord[j]}` // Combined ID and value label
}));

let checkNodes = H.map((_, i) => ({
    id: "z" + i,
    type: "z",
    x: checkNodeStartX,
    y: i * checkNodeSpacingY + verticalOffset,
    peeled: false,
    value: '0', // Initially all check nodes have unknown values
    label: `z${i}: ?` // Combined ID and value label
}));

let nodes = [...bitNodes, ...checkNodes];


// Create links (edges) between bits and checks based on H matrix
let links = [];
H.forEach((row, i) => {
    row.forEach((val, j) => {
        if (val === 1) {
            links.push({ source: "x" + j, target: "z" + i });
        }
    });
});

// Add the links to the SVG
let link = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .enter().append("line")
    .attr("stroke-width", 2)
    .attr("stroke", "#999");

// Add the nodes to the SVG
let node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append(d => document.createElementNS("http://www.w3.org/2000/svg", d.type === "x" ? "circle" : "rect"))
    .attr("r", d => d.type === "x" ? nodeRadius : null) // Only circles get radius
    .attr("width", d => d.type === "z" ? nodeRadius * 2 : null) // Width for squares
    .attr("height", d => d.type === "z" ? nodeRadius * 2 : null) // Height for squares
    .attr("fill", d => d.type === "x" ? "blue" : "green")
    .attr("cx", d => d.type === "x" ? d.x : null)
    .attr("cy", d => d.type === "x" ? d.y : null)
    .attr("x", d => d.type === "z" ? d.x - nodeRadius : null) // Center squares
    .attr("y", d => d.type === "z" ? d.y - nodeRadius : null) // Center squares
    .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );


let labels = svg.append("g")
    .attr("class", "labels")
    .selectAll("foreignObject")
    .data(nodes)
    .enter()
    .append("foreignObject")
    .attr("x", d => d.type === "x" ? d.x - nodeRadius - bitXShiftLabel : d.x + nodeRadius + checkXShiftLabel)
    .attr("y", d => d.y + yLabelShift)
    .attr("id", d => d.id)
    .attr("width", 100)
    .attr("height", 30)
    .append("xhtml:div")
    .style("font-size", "15px")
    .html(d => {
        if (d.type === "x") {
            return `\\(x_{${d.id.slice(1)}}: ${d.value}\\)`;
        }
        if(d.type === "z"){
            return `\\(z_{${d.id.slice(1)}}: ${d.value}\\)`;
        }
        return d.label;
    });

// Trigger MathJax rendering
// MathJax.Hub.Queue(["Typeset", MathJax.Hub]);

// Update the positions of the links
function updateLinks() {
    link.attr("x1", d => bitNodes.find(n => n.id === d.source).x)
        .attr("y1", d => bitNodes.find(n => n.id === d.source).y)
        .attr("x2", d => checkNodes.find(n => n.id === d.target).x)
        .attr("y2", d => checkNodes.find(n => n.id === d.target).y);
}

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

    // Update labels positions with the combined ID and value
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



// Other three options that are not the chosen H matrix
// const incorrectOptions = setOfH.filter(h => !arraysEqual(h, H)).slice(0, 3);

// Helper function to compare two arrays
function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i].length !== b[i].length) return false;
        for (let j = 0; j < a[i].length; j++) {
            if (a[i][j] !== b[i][j]) return false;
        }
    }
    return true;
}


// Call the function to add options to the form
// addOptionsToForm();

// Initial call to update links based on static positions
updateLinks();
adjustSVGSize();


// // Function to update the Tanner graph after peeling a node
// function updateGraph() {
//     // Update the positions of the nodes and links after peeling
//     nodes.forEach(node => {
//         if (node.peeled) {
//             // Remove the node from the graph (visual removal)
//             d3.select(`#${node.id}`).remove();
//         }
//     });

//     links = links.filter(link => {
//         // Remove links to peeled nodes
//         return !bitNodes.some(n => n.peeled && (link.source === n.id || link.target === n.id)) &&
//             !checkNodes.some(n => n.peeled && (link.source === n.id || link.target === n.id));
//     });

//     // Update the SVG with the remaining nodes and links
//     svg.selectAll("line").data(links).enter().append("line")
//         .attr("stroke-width", 2)
//         .attr("stroke", "#999");

//     svg.selectAll("circle, rect").data(nodes).enter()
//         .append(d => document.createElementNS("http://www.w3.org/2000/svg", d.type === "x" ? "circle" : "rect"))
//         .attr("r", d => d.type === "x" ? nodeRadius : null)
//         .attr("width", d => d.type === "z" ? nodeRadius * 2 : null)
//         .attr("height", d => d.type === "z" ? nodeRadius * 2 : null)
//         .attr("fill", d => d.type === "x" ? "blue" : "green")
//         .attr("cx", d => d.type === "x" ? d.x : null)
//         .attr("cy", d => d.type === "x" ? d.y : null)
//         .attr("x", d => d.type === "z" ? d.x - nodeRadius : null)
//         .attr("y", d => d.type === "z" ? d.y - nodeRadius : null);
// }

// function insertUnderscore(str) {
//     return str[0] + '_' + str.slice(1);
// }

// // Function to get initial messages for the first round
// function getInitialMessages() {
//     let messages = [];
//     bitNodes.forEach(node => {
//         if (node.value === '?') {
//             // Find connected check nodes
//             const connections = links.filter(link => link.source === node.id);
//             connections.forEach(conn => {
//                 messages.push({
//                     from: node.id,
//                     to: conn.target,
//                     message: `\\(\\mu_{${insertUnderscore(node.id)}\\to ${insertUnderscore(conn.target)}}\\)` 
//                 });
//             });
//         }
//     });
//     return messages;
// }


// // Initialize the graph with first round options
// generateMessageOptions(getInitialMessages());

// function updateGraphForRound(peeledNodes) {
//     // Update visual representation for all peeled nodes
//     peeledNodes.forEach(node => {
//         const nodeElement = svg.select(`[id='${node.id}']`);
//         nodeElement
//             .transition()
//             .duration(500)
//             .attr("fill", "#ff6b6b")
//             .attr("opacity", 0.6);

//         // Update all connected links
//         const affectedLinks = links.filter(link =>
//             link.source === node.id || link.target === node.id
//         );

//         affectedLinks.forEach(link => {
//             svg.selectAll("line")
//                 .filter(l => l.source === link.source && l.target === link.target)
//                 .transition()
//                 .duration(500)
//                 .attr("stroke", "#ddd")
//                 .attr("opacity", 0.3);
//         });

//         // Update labels
//         svg.select(`text#label-${node.id}`)
//             .text(`${node.id} (Peeled)`);
//     });

//     // Update links data structure
//     links = links.filter(link =>
//         !peeledNodes.some(node =>
//             link.source === node.id || link.target === node.id
//         )
//     );
// }

// // Function to get valid messages for current round
// function getCurrentRoundMessages() {
//     let messages = [];
    
//     if (currentDirection === 'left-to-right') {
//         // Get messages from erasure bit nodes to check nodes
//         bitNodes.forEach(node => {
//             if (node.peeled) return;
//             if (node.value === '?') {
//                 // Count unpeeled connections
//                 const connections = links.filter(link =>
//                     link.source === node.id &&
//                     !checkNodes.find(n => n.id === link.target).peeled
//                 );
                
//                 if (connections.length === 1) {
//                     const checkNodeId = connections[0].target;
//                     messages.push({
//                         from: node.id,
//                         to: checkNodeId,
//                         message: `\\(\\mu_{${insertUnderscore(node.id)}\\to ${insertUnderscore(checkNodeId)}}\\)`
//                     });
//                 }
//             }
//         });
//     } else {
//         // Get messages from check nodes to bit nodes
//         checkNodes.forEach(node => {
//             if (node.peeled) return;
            
//             // Count unpeeled connections
//             const connections = links.filter(link =>
//                 link.target === node.id &&
//                 !bitNodes.find(n => n.id === link.source).peeled
//             );
            
//             if (connections.length === 1) {
//                 const bitNodeId = connections[0].source;
//                 messages.push({
//                     from: node.id,
//                     to: bitNodeId,
//                     message: `\\(\\mu_{${insertUnderscore(node.id)}\\to ${insertUnderscore(bitNodeId)}}\\)`
//                 });
//             }
//         });
//     }
    
//     return messages;
// }

// function generateMessageOptions(correctMessages) {
//     // Get the form element
//     const form = document.getElementById('form1');
//     form.innerHTML = '';

//     // Create 4 options, only one with all correct messages
//     const options = [];

//     // Option 1: All correct messages (the right answer)
//     options.push({
//         id: 'correct',
//         messages: correctMessages,
//         label: 'Messages passing in this round:'
//     });

//     // Option 2: Messages that would be valid in the wrong direction
//     const wrongDirectionMessages = [];
//     if (currentDirection === 'left-to-right') {
//         checkNodes.forEach(node => {
//             if (!node.peeled) {
//                 const connections = links.filter(link =>
//                     link.target === node.id &&
//                     !bitNodes.find(n => n.id === link.source).peeled
//                 );
//                 if (connections.length === 1) {
//                     const bitNodeId = connections[0].source;
//                     wrongDirectionMessages.push({
//                         from: node.id,
//                         to: bitNodeId,
//                         message: `\\(\\mu_{${insertUnderscore(node.id)}\\to ${insertUnderscore(bitNodeId)}}\\)`
//                     });
//                 }
//             }
//         });
//     } else {
//         bitNodes.forEach(node => {
//             if (!node.peeled && node.value === '?') {
//                 const connections = links.filter(link =>
//                     link.source === node.id &&
//                     !checkNodes.find(n => n.id === link.target).peeled
//                 );
//                 if (connections.length === 1) {
//                     const checkNodeId = connections[0].target;
//                     wrongDirectionMessages.push({
//                         from: node.id,
//                         to: checkNodeId,
//                         message: `\\(\\mu_{${insertUnderscore(node.id)}\\to ${insertUnderscore(checkNodeId)}}\\)`
//                     });
//                 }
//             }
//         });
//     }
//     ensureNonEmpty(wrongDirectionMessages);
//     options.push({
//         id: 'wrong-direction',
//         messages: wrongDirectionMessages,
//         label: 'Messages passing in this round:'
//     });

//     // Option 3: Messages from nodes with degree > 1
//     const invalidDegreeMessages = [];
//     if (currentDirection === 'left-to-right') {
//         bitNodes.forEach(node => {
//             if (!node.peeled && node.value === '?') {
//                 const connections = links.filter(link =>
//                     link.source === node.id &&
//                     !checkNodes.find(n => n.id === link.target).peeled
//                 );
//                 if (connections.length > 1) {
//                     const checkNodeId = connections[0].target;
//                     invalidDegreeMessages.push({
//                         from: node.id,
//                         to: checkNodeId,
//                         message: `\\(\\mu_{${insertUnderscore(node.id)}\\to ${insertUnderscore(checkNodeId)}}\\)`
//                     });
//                 }
//             }
//         });
//     } else {
//         checkNodes.forEach(node => {
//             if (!node.peeled) {
//                 const connections = links.filter(link =>
//                     link.target === node.id &&
//                     !bitNodes.find(n => n.id === link.source).peeled
//                 );
//                 if (connections.length > 1) {
//                     const bitNodeId = connections[0].source;
//                     invalidDegreeMessages.push({
//                         from: node.id,
//                         to: bitNodeId,
//                         message: `\\(\\mu_{${insertUnderscore(node.id)}\\to ${insertUnderscore(bitNodeId)}}\\)`
//                     });
//                 }
//             }
//         });
//     }
//     ensureNonEmpty(invalidDegreeMessages);
//     options.push({
//         id: 'invalid-degree',
//         messages: invalidDegreeMessages.slice(0, correctMessages.length),
//         label: 'Messages passing in this round:'
//     });

//     // Option 4: Messages between unconnected nodes
//     const invalidMessages = generateInvalidMessages(correctMessages.length);
//     ensureNonEmpty(invalidMessages);
//     options.push({
//         id: 'invalid',
//         messages: invalidMessages,
//         label: 'Messages passing in this round:'
//     });

//     // Shuffle options
//     const shuffledOptions = shuffleArray(options);

//     // Add options to form
//     shuffledOptions.forEach((option, index) => {
//         const div = document.createElement('div');
//         div.className = 'option';

//         const radio = document.createElement('input');
//         radio.type = 'radio';
//         radio.name = 'message-set';
//         radio.id = option.id;
//         radio.value = index;

//         const label = document.createElement('label');
//         label.htmlFor = option.id;
//         label.innerHTML = `${option.label}<br>` +
//             option.messages.map(msg => msg.message).join(', ');

//         div.appendChild(radio);
//         div.appendChild(label);
//         form.appendChild(div);
//     });
// }

// function ensureNonEmpty(messages) {
//     if (messages.length === 0) {
//         // Generate a random check node ID and bit node ID
//         const randomCheckNode = `x${Math.floor(Math.random() * checkNodes.length)}`;
//         const randomBitNode = `z${Math.floor(Math.random() * bitNodes.length)}`;

//         // Add a placeholder message
//         messages.push({
//             from: randomCheckNode,
//             to: randomBitNode,
//             message: `\\(\\mu_{${insertUnderscore(randomCheckNode)}\\to ${insertUnderscore(randomBitNode)}}\\)`
//         });
//     }
// }

// // Modify NextRound() to use getCurrentRoundMessages
// function NextRound() {
//     const observation = document.getElementById("tannerQuestionObservation");
//     const form = document.getElementById('form1');
//     const selectedOption = Array.from(form.elements).find(el => el.checked);

//     if (!selectedOption) {
//         observation.innerHTML = "Please select an option before proceeding.";
//         observation.style.color = "red";
//         return;
//     }

//     // Get the current valid messages
//     const currentMessages = getCurrentRoundMessages();

//     if (currentMessages.length === 0) {
//         observation.innerHTML = "Decoding complete! No more nodes to peel.";
//         observation.style.color = "green";
//         return;
//     }

//     // Check if the selected option is correct
//     if (selectedOption.id !== 'correct') {
//         if (observation.innerHTML === "Incorrect. Please try again.") {
//             observation.innerHTML = "Still incorrect. Please review your choice carefully.";
//         } else {
//             observation.innerHTML = "Incorrect. Please try again.";
//         }
//         observation.style.color = "red";
//         return;
//     }

//     // Correct option selected - proceed with the round
//     observation.innerHTML = "Correct! Processing next round...";
//     observation.style.color = "green";

//     // Peel the nodes and update the graph
//     let peeledNodes = [];
//     if (currentDirection === 'left-to-right') {
//         bitNodes.forEach(node => {
//             if (!node.peeled && node.value === '?' && getNodeDegrees(node.id) === 1) {
//                 node.peeled = true;
//                 peeledNodes.push(node);
//             }
//         });
//     } else {
//         checkNodes.forEach(node => {
//             if (!node.peeled && getNodeDegrees(node.id) === 1) {
//                 node.peeled = true;
//                 peeledNodes.push(node);
//             }
//         });
//     }

//     // Update graph visualization
//     updateGraphForRound(peeledNodes);
    
//     // Switch direction and prepare for next round
//     currentDirection = (currentDirection === 'left-to-right') ? 'right-to-left' : 'left-to-right';
//     currentRound++;
    
//     // Generate options for the next valid messages
//     const nextMessages = getCurrentRoundMessages();
//     if (nextMessages.length > 0) {
//         generateMessageOptions(nextMessages);
//     } else {
//         observation.innerHTML = "Decoding complete! No more nodes to peel.";
//         observation.style.color = "green";
//     }
    
//     // Reset the form selection
//     form.reset();
// }

// function generateInvalidMessages(count) {
//     const messages = [];
//     for (let i = 0; i < count; i++) {
//         const randomBit = Math.floor(Math.random() * bitNodes.length);
//         const randomCheck = Math.floor(Math.random() * checkNodes.length);
//         // Ensure this is not an actual connection
//         if (!links.some(link =>
//             link.source === `x${randomBit}` &&
//             link.target === `z${randomCheck}`
//         )) {
//             messages.push({
//                 from: `x${randomBit}`,
//                 to: `z${randomCheck}`,
//                 message: `\\(\\mu_{x_${randomBit}\\to z_${randomCheck}}\\)`
//             });
//         }
//     }
//     return messages;
// }

// function shuffleArray(array) {
//     for (let i = array.length - 1; i > 0; i--) {
//         const j = Math.floor(Math.random() * (i + 1));
//         [array[i], array[j]] = [array[j], array[i]];
//     }
//     return array;
// }



// // Helper function to count current node degrees
// function getNodeDegrees(nodeId) {
//     return links.filter(link =>
//         (link.source === nodeId || link.target === nodeId) &&
//         !bitNodes.find(n => n.id === link.source).peeled &&
//         !checkNodes.find(n => n.id === link.target).peeled
//     ).length;
// }

// // Call this function to start the iterative peeling process
// // nextRound();

function runPeelingDecoder(receivedWord, H) {
    let decodedWord = [...receivedWord];
    let checkNodeDegrees = Array(H.length).fill(0); // Store degrees of each check node
    let remainingErasures = true;

    // Initialize checkNodeDegrees to count the number of unknown bits in each check node
    for (let i = 0; i < H.length; i++) {
        for (let j = 0; j < decodedWord.length; j++) {
            if (H[i][j] === 1 && decodedWord[j] === '?') {
                checkNodeDegrees[i]++;
            }
        }
    }

    while (remainingErasures) {
        remainingErasures = false;

        for (let i = 0; i < H.length; i++) {
            if (checkNodeDegrees[i] === 1) {
                // Find the single unknown bit in this check node
                let unknownBitIndex = -1;
                let sum = 0;

                for (let j = 0; j < decodedWord.length; j++) {
                    if (H[i][j] === 1) {
                        if (decodedWord[j] === '?') {
                            unknownBitIndex = j;
                        } else {
                            sum = (sum + parseInt(decodedWord[j])) % 2; // Add the known bits
                        }
                    }
                }

                if (unknownBitIndex !== -1) {
                    // Resolve the unknown bit
                    decodedWord[unknownBitIndex] = (sum === 0 ? '0' : '1');
                    remainingErasures = true;

                    // Update the degrees of connected check nodes
                    for (let k = 0; k < H.length; k++) {
                        if (H[k][unknownBitIndex] === 1) {
                            checkNodeDegrees[k]--;
                        }
                    }
                }
            }
        }
    }

    // Check if any erasures remain
    let fullyDecoded = !decodedWord.includes('?');

    return {
        decodedWord,
        fullyDecoded
    };
}

// Generate random incorrect codewords
function generateIncorrectOption(length) {
    const codeword = Array(length).fill('0');
    const numErrors = Math.floor(Math.random() * 3) + 1; // 1-3 errors
    const hasErasures = Math.random() < 0.5;
    
    // Introduce random bit flips
    for (let i = 0; i < numErrors; i++) {
        const pos = Math.floor(Math.random() * length);
        if (hasErasures && Math.random() < 0.3) {
            codeword[pos] = '?';
        } else {
            codeword[pos] = (parseInt(codeword[pos]) ^ 1).toString();
        }
    }
    
    return {
        codeword,
        fullyDecoded: !hasErasures
    };
}

// // Original received word from the code
// const receivedWord = ['?', '1', '?', '0', '1', '?', '0'];

// // H matrix from the code
// const H = [
//     [1, 1, 0, 1, 1, 0, 0],
//     [1, 0, 1, 0, 0, 1, 0],
//     [0, 1, 1, 1, 0, 0, 1]
// ];

// Get correct decoded result
const correctResult = runPeelingDecoder(receivedWord, H);

const form = document.getElementById('form1');
form.innerHTML = '';

// Generate options
const options = [
    {
        codeword: correctResult.decodedWord.join(''),
        status: correctResult.fullyDecoded ? "Fully Decoded" : "Partially Decoded",
        correct: true
    },
    ...Array(3).fill(null).map(() => {
        const generatedOption = generateIncorrectOption(7).codeword.join('');
        return {
            codeword: generatedOption,
            status: generatedOption.includes('?') ? "Partially decoded" : "Fully Decoded",
            correct: false
        };
    })
];

const formattedOptions = options.map((option, index) => ({
    id: `option-${index}`,
    messages: [{
        message: `\\((${option.codeword})\\), ${option.status}`
    }],
    label: 'Decoded codeword:',
    correct: option.correct
}));

// Shuffle options
const shuffledOptions = shuffleArray(formattedOptions);

shuffledOptions.forEach((option, index) => {
    const div = document.createElement('div');
    div.className = 'option';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'decoded-codeword';
    radio.id = option.id;
    radio.value = index;
    radio.correct = option.correct;

    const label = document.createElement('label');
    label.htmlFor = option.id;
    label.innerHTML = `${option.label}<br>` +
        option.messages.map(msg => msg.message).join(', ');

    div.appendChild(radio);
    div.appendChild(label);
    form.appendChild(div);
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

console.log("Original received word:", receivedWord.join(''));
console.log("\nDecoding options:");
shuffledOptions.forEach((option, index) => {
    console.log(`Decoded codeword: ${option.messages[0].message}`);
});
console.log("\nCorrect decode:", shuffledOptions.findIndex(opt => opt.correct));

function NextRound() {
    const observation = document.getElementById("tannerQuestionObservation");
    const form = document.getElementById('form1');
    const selectedOption = Array.from(form.elements).find(el => el.checked);

    if (!selectedOption) {
        observation.innerHTML = "Please select an option before proceeding.";
        observation.style.color = "red";
        return;
    }

    console.log(selectedOption);
    // Check if the selected option is correct
    if (selectedOption.correct !== true) {
        if(correctResult.fullyDecoded === false && selectedOption.status === 1){
            console.log("HERE");
            observation.innerHTML = "Is this the only possible codeword that could have been sent?";
            return;
        }
        if (observation.innerHTML == "Incorrect. Please try again. An easy way to verify your answer is that the decoded vector and the received vector should be identical in all the unerased positions.") {
            observation.innerHTML = "Still incorrect. Please review the theory once again.";
        } else {
            observation.innerHTML = "Incorrect. Please try again. An easy way to verify your answer is that the decoded vector and the received vector should be identical in all the unerased positions.";
        }
        observation.style.color = "red";
        return;
    }

    // Correct option selected - proceed with the round
    observation.innerHTML = "Correct! We can move on to more complicated channel models now.";
    observation.style.color = "green";
}
