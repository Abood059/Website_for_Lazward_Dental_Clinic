document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const errorDiv = document.getElementById('registerError');

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorDiv.textContent = '';
      
      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'جاري التحميل...';
      submitBtn.disabled = true;

      const firstName = document.getElementById('firstName').value;
      const lastName = document.getElementById('lastName').value;
      const clinicName = document.getElementById('clinicName').value;
      const phone = document.getElementById('phone').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('passwordConfirm').value;

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName,
            lastName,
            clinicName,
            phone,
            email,
            password,
            passwordConfirm
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || (data.errors ? data.errors.join(', ') : 'حدث خطأ غير متوقع'));
        }

        // Show success toast and redirect
        if (typeof showToast === 'function') {
           showToast('تم إنشاء الحساب بنجاح! سيتم توجيهك لتسجيل الدخول.', 'success');
        } else {
           alert('تم إنشاء الحساب بنجاح!');
        }
        
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);

      } catch (error) {
        errorDiv.textContent = error.message;
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }
});
