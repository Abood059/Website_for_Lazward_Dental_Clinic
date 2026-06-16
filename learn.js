document.addEventListener('DOMContentLoaded', async () => {
  const blogContainer = document.getElementById('blog-container');
  const faqContainer = document.getElementById('faq-container');

  // Load Blog Posts
  if (blogContainer) {
    try {
      const res = await fetch('/api/content/blog');
      const data = await res.json();
      
      if (res.ok && data.data && data.data.posts.length > 0) {
        blogContainer.innerHTML = data.data.posts.map(post => `
          <div class="result-card">
            <img src="${post.imageUrl || 'images/default.jpg'}" alt="${post.title}" style="max-height: 200px; object-fit: cover; width: 100%; border-radius: 10px;" />
            <h3>${post.title}</h3>
            <p>${post.contentHtml.substring(0, 100)}...</p>
          </div>
        `).join('');
      } else {
        blogContainer.innerHTML = '<p style="text-align: center; width: 100%;">لا توجد مقالات منشورة حالياً.</p>';
      }
    } catch (error) {
      console.error(error);
      blogContainer.innerHTML = '<p style="text-align: center; width: 100%; color: red;">عذراً، حدث خطأ في تحميل المحتوى.</p>';
    }
  }

  // Load FAQs
  if (faqContainer) {
    try {
      const res = await fetch('/api/content/faq');
      const data = await res.json();

      if (res.ok && data.data && data.data.faqs.length > 0) {
        faqContainer.innerHTML = data.data.faqs.map(faq => `
          <div class="faq-item">
            <button class="faq-btn" aria-expanded="false">
              <span>${faq.question}</span>
              <span class="faq-arrow">›</span>
            </button>
            <div class="faq-answer"><p>${faq.answer}</p></div>
          </div>
        `).join('');

        // Re-attach accordion events
        document.querySelectorAll('.faq-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const expanded = btn.getAttribute('aria-expanded') === 'true';
            const answer   = btn.nextElementSibling;
      
            // Close all others
            document.querySelectorAll('.faq-btn').forEach(other => {
              if (other !== btn) {
                other.setAttribute('aria-expanded', 'false');
                other.nextElementSibling.classList.remove('open');
              }
            });
      
            btn.setAttribute('aria-expanded', String(!expanded));
            answer.classList.toggle('open', !expanded);
          });
        });
      } else {
        faqContainer.innerHTML = '<p style="text-align: center;">لا توجد أسئلة شائعة حالياً.</p>';
      }
    } catch (error) {
      console.error(error);
      faqContainer.innerHTML = '<p style="text-align: center; color: red;">عذراً، حدث خطأ في تحميل المحتوى.</p>';
    }
  }
});
