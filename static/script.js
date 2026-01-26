document.getElementById('video-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const statusDiv = document.getElementById('status');
    const resultDiv = document.getElementById('result');
    const generateBtn = document.getElementById('generate-btn');

    statusDiv.textContent = 'Generating video... This may take a few minutes.';
    resultDiv.innerHTML = '';
    generateBtn.disabled = true;

    try {
        const response = await fetch('/generate', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Something went wrong');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        statusDiv.textContent = 'Video generated successfully!';
        resultDiv.innerHTML = `<a href="${url}" download="output.mp4">Download Video</a>`;

    } catch (error) {
        statusDiv.textContent = `Error: ${error.message}`;
    } finally {
        generateBtn.disabled = false;
    }
});