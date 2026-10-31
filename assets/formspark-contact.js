(() => {
  const form = document.querySelector('form[data-form-kind="contact-message"]');
  if (!form) return;

  const endpoint = String((window.SK8_CONFIG && window.SK8_CONFIG.formsparkContactEndpoint) || '').trim();
  if (!/^https:\/\/submit-form\.com\/[A-Za-z0-9_-]+$/.test(endpoint)) return;

  form.removeAttribute('data-api-form');
  form.action = endpoint;

  const imageInput = form.querySelector('#contact-image');
  const imageStatus = form.querySelector('#contact-image-status');
  const imageUrl = form.querySelector('#contact-image-url');
  const imageLink = form.querySelector('#contact-image-link');
  const config = window.SK8_CONFIG || {};
  const validTypes = new Set(['image/jpeg','image/png','image/webp','image/gif']);
  const maxBytes = 5 * 1024 * 1024;

  async function uploadSelectedImage(file) {
    if (!validTypes.has(file.type) || file.size > maxBytes || !file.size) {
      throw new Error('Choose a JPG, PNG, WebP or GIF image under 5 MB.');
    }
    const cloudName = String(config.contactImageCloudName || '').trim();
    const preset = String(config.contactImageUploadPreset || '').trim();
    if (!cloudName || !preset) {
      throw new Error('Direct image upload is not configured yet. Please use the image-link field instead.');
    }
    const body = new FormData();
    body.append('file', file);
    body.append('upload_preset', preset);
    const response = await fetch('https://api.cloudinary.com/v1_1/' + encodeURIComponent(cloudName) + '/image/upload', {method:'POST',body});
    const result = await response.json();
    if (!response.ok || !/^https:\/\//i.test(String(result.secure_url || ''))) {
      throw new Error('The image upload failed. Please try again or provide an image link.');
    }
    return result.secure_url;
  }

  imageInput?.addEventListener('change', () => {
    if (imageUrl) imageUrl.value = '';
    const file = imageInput.files && imageInput.files[0];
    if (imageStatus) imageStatus.textContent = file ? 'Selected: ' + file.name : '';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const status = form.querySelector('[data-form-status]');
    const button = form.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(form).entries());

    if (data.website) {
      form.reset();
      if (status) {
        status.className = 'status-box show success';
        status.textContent = 'Thank you. Your message has been sent.';
      }
      return;
    }

    delete data.website;
    const selectedImage = imageInput?.files?.[0];
    if (selectedImage) {
      if (button) button.disabled = true;
      if (status) { status.className = 'status-box show'; status.textContent = 'Uploading image…'; }
      try {
        data.image_url = await uploadSelectedImage(selectedImage);
        if (imageUrl) imageUrl.value = data.image_url;
        if (imageStatus) imageStatus.textContent = 'Image uploaded successfully.';
      } catch (error) {
        if (status) { status.className = 'status-box show error'; status.textContent = error.message; }
        if (button) button.disabled = false;
        return;
      }
    }
    if (!data.image_url) delete data.image_url;
    if (imageLink?.value && !/^https:\/\//i.test(imageLink.value)) {
      if (status) { status.className = 'status-box show error'; status.textContent = 'Please use an https:// image link.'; }
      if (button) button.disabled = false;
      return;
    }
    data._email = {
      subject: `SK8 Scoop contact: ${data.category || 'general'}`,
      from: data.name || 'SK8 Scoop website visitor'
    };

    if (button) button.disabled = true;
    if (status) {
      status.className = 'status-box show';
      status.textContent = 'Sending…';
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      if (status) {
        status.className = 'status-box show success';
        status.textContent = 'Thank you. Your message has been sent to SK8 Scoop.';
      }
      if (typeof window.sk8Track === 'function') {
        window.sk8Track('contact_message_completed', {
          form_action: endpoint,
          form_kind: 'contact-message',
          form_provider: 'Formspark'
        });
      }
      form.reset();
    } catch (error) {
      if (typeof window.sk8Track === 'function') {
        window.sk8Track('form_error', {
          form_kind: 'contact-message',
          error_type: 'formspark_submission_failed'
        });
      }
      if (status) {
        status.className = 'status-box show error';
        status.textContent = 'This could not be sent automatically. Please email contact@sk8scoop.com instead.';
      }
    } finally {
      if (button) button.disabled = false;
    }
  });
})();
