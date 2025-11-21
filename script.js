const startBtn = document.getElementById('start-btn')
const checkout = document.getElementById('checkout')
const quiz = document.getElementById('quiz')

if (startBtn) {
  startBtn.addEventListener('click', () => { window.location.href = 'quiz.html' })
}

function formatCurrencyBRL(value) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) }

function setupCheckout() {
  const subtotalEl = document.getElementById('subtotal')
  const shippingEl = document.getElementById('shipping')
  const totalEl = document.getElementById('total')
  const shippingCards = document.querySelectorAll('.radio-card')
  const confirmBtn = document.getElementById('confirm-btn')
  const cepInput = document.getElementById('cep')
  const cepLoader = document.getElementById('cep-loader')
  const cepError = document.getElementById('cep-error')
  const street = document.getElementById('street')
  const neighborhood = document.getElementById('neighborhood')
  const city = document.getElementById('city')
  const state = document.getElementById('state')
  const shippingSection = document.getElementById('shipping-section')
  const payCard = document.querySelector('.pay-option')
  const fullName = document.getElementById('full-name')
  const email = document.getElementById('email')
  const phone = document.getElementById('phone')
  const cpf = document.getElementById('cpf')
  const pixInfo = document.getElementById('pix-info')
  const pixQr = document.getElementById('pix-qr')
  const pixCode = document.getElementById('pix-code')
  const pixAmountEl = document.getElementById('pix-amount')
  const shippingLine = document.getElementById('shipping-line')
  const extrasLine = document.getElementById('extras-line')
  const extrasEl = document.getElementById('extras')
  const orderBump = document.getElementById('order-bump')
  const extraDec = document.getElementById('extra-dec')
  const extraInc = document.getElementById('extra-inc')
  const extraCountEl = document.getElementById('extra-count')
  const shirtCards = Array.from(document.querySelectorAll('.shirt-card'))
  let shipping = 0
  let selectedShippingCode = null
  let cepOk = false
  let extrasCount = 0
  const extrasUnit = 24.99
  let brindeModel = 'camisa1'
  const subtotal = 0

  function updateTotals() {
    const extras = extrasCount * extrasUnit
    if (subtotalEl) subtotalEl.textContent = formatCurrencyBRL(subtotal)
    if (shippingEl) shippingEl.textContent = formatCurrencyBRL(shipping)
    if (extrasEl) extrasEl.textContent = formatCurrencyBRL(extras)
    if (extrasLine) extrasLine.style.display = extras > 0 ? '' : 'none'
    if (totalEl) totalEl.textContent = formatCurrencyBRL(subtotal + shipping + extras)
  }
  function onlyDigits(s) { return (s || '').replace(/\D/g,'') }
  function isEmail(s) { return /.+@.+\..+/.test((s || '').trim()) }
  function validateCheckout() {
    const nameOk = (fullName && fullName.value.trim().length >= 3)
    const emailOk = (email && isEmail(email.value))
    const phoneOk = (phone && onlyDigits(phone.value).length >= 10)
    const cpfOk = (cpf && onlyDigits(cpf.value).length === 11)
    const shipOk = !!selectedShippingCode && shipping > 0
    const allOk = cepOk && nameOk && emailOk && phoneOk && cpfOk && shipOk
    if (confirmBtn) confirmBtn.disabled = !allOk
  }
  shippingCards.forEach(c => {
    c.addEventListener('click', () => {
      if (!cepOk) return
      shippingCards.forEach(x => x.classList.remove('active'))
      c.classList.add('active')
      const price = parseFloat(c.dataset.price || '0')
      shipping = isNaN(price) ? 0 : price
      selectedShippingCode = c.dataset.code || null
      updateTotals()
      if (shippingLine) shippingLine.style.display = ''
      if (orderBump) { orderBump.style.display = ''; orderBump.classList.add('reveal') }
      validateCheckout()
    })
  })
  updateTotals()

  const countdownEl = document.getElementById('countdown')
  let remaining = 10 * 60
  function tick() {
    const m = String(Math.floor(remaining / 60)).padStart(2,'0')
    const s = String(remaining % 60).padStart(2,'0')
    if (countdownEl) countdownEl.textContent = `00:${m}:${s}`
    remaining -= 1
    if (remaining < 0) { return }
    setTimeout(tick, 1000)
  }
  tick()

  function clearAddressFields() {
    if (street) street.value = ''
    if (neighborhood) neighborhood.value = ''
    if (city) city.value = ''
    if (state) state.value = ''
  }
  function showShippingSection() {
    if (!shippingSection) return
    shippingSection.style.display = ''
    shippingSection.classList.add('reveal')
    if (orderBump) { orderBump.style.display = 'none'; orderBump.classList.remove('reveal') }
  }
  function hideShippingSection() {
    if (!shippingSection) return
    shippingSection.style.display = 'none'
    shippingSection.classList.remove('reveal')
    if (orderBump) { orderBump.style.display = 'none'; orderBump.classList.remove('reveal') }
  }
  async function fetchViaCep(cep) {
    try {
      if (cepLoader) cepLoader.classList.remove('hidden')
      if (cepError) cepError.textContent = ''
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.erro) throw new Error('CEP não encontrado')
      if (street) street.value = data.logradouro || ''
      if (neighborhood) neighborhood.value = data.bairro || ''
      if (city) city.value = data.localidade || ''
      if (state) state.value = data.uf || ''
      if (cepInput) cepInput.classList.remove('invalid')
      cepOk = true
      showShippingSection()
      validateCheckout()
    } catch (e) {
      clearAddressFields()
      hideShippingSection()
      cepOk = false
      if (cepError) cepError.textContent = e.message.includes('HTTP 4') || e.message.includes('HTTP 5') ? 'Erro ao consultar CEP. Tente novamente.' : e.message
      if (cepInput) cepInput.classList.add('invalid')
      validateCheckout()
  } finally {
    if (cepLoader) cepLoader.classList.add('hidden')
  }
}
  function onCepInput() {
    if (!cepInput) return
    const digits = cepInput.value.replace(/\D/g, '')
    cepInput.value = digits.replace(/(\d{5})(\d{0,3})/, (m, a, b) => b ? `${a}-${b}` : a)
    if (digits.length === 8) fetchViaCep(digits)
    else {
      clearAddressFields()
      hideShippingSection()
      if (cepError) cepError.textContent = digits.length > 0 ? 'CEP deve ter 8 dígitos' : ''
      if (cepInput) cepInput.classList.toggle('invalid', digits.length > 0 && digits.length !== 8)
      if (confirmBtn) confirmBtn.disabled = false
    }
  }
  if (cepInput) cepInput.addEventListener('input', onCepInput)

  if (payCard) {
    payCard.classList.add('active')
    payCard.setAttribute('aria-checked', 'true')
    const radio = payCard.querySelector('.method-radio')
    if (radio) radio.checked = true
    payCard.addEventListener('click', () => {
      payCard.classList.add('active')
      payCard.setAttribute('aria-checked', 'true')
      validateCheckout()
    })
  }
  validateCheckout()

  ;['input','change'].forEach(evt => {
    if (fullName) fullName.addEventListener(evt, validateCheckout)
    if (email) email.addEventListener(evt, validateCheckout)
    if (phone) phone.addEventListener(evt, validateCheckout)
    if (cpf) cpf.addEventListener(evt, () => {
      if (cpf) {
        const d = onlyDigits(cpf.value)
        cpf.value = d.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (m,a,b,c,e) => e ? `${a}.${b}.${c}-${e}` : `${a}.${b}.${c}`)
      }
      validateCheckout()
    })
  })

  shirtCards.forEach(card => {
    card.addEventListener('click', () => {
      shirtCards.forEach(x => { x.classList.remove('active'); x.setAttribute('aria-checked', 'false') })
      card.classList.add('active')
      card.setAttribute('aria-checked', 'true')
      brindeModel = card.dataset.model || 'camisa1'
    })
  })

  function setExtrasCount(n) {
    extrasCount = Math.max(0, Math.min(99, n))
    if (extraCountEl) extraCountEl.textContent = String(extrasCount)
    updateTotals()
    validateCheckout()
  }
  if (extraDec) extraDec.addEventListener('click', () => setExtrasCount(extrasCount - 1))
  if (extraInc) extraInc.addEventListener('click', () => setExtrasCount(extrasCount + 1))

  

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      validateCheckout()
      if (confirmBtn.disabled) return
      const shippingCode = selectedShippingCode || 'correios'
      const shippingCents = shippingCode === 'jadlog' ? 3499 : 3799
      const extrasCents = Math.round(extrasCount * 24.99 * 100)
      const amountCents = shippingCents + extrasCents
      const phoneDigits = onlyDigits(phone ? phone.value : '')
      const cpfDigits = onlyDigits(cpf ? cpf.value : '')
      const items = [
        { title: shippingCode === 'jadlog' ? 'Frete Jadlog' : 'Frete Correios', unitPrice: shippingCents, quantity: 1, tangible: false, externalRef: shippingCode }
      ]
      items.push({ title: `Camiseta G (${brindeModel})`, unitPrice: 0, quantity: 1, tangible: true, externalRef: 'camisa_brinde' })
      if (extrasCents > 0 && extrasCount > 0) {
        items.push({ title: 'Camiseta adicional G', unitPrice: 2499, quantity: extrasCount, tangible: true, externalRef: 'camisa_extra' })
      }
      const body = {
        amount: amountCents,
        currency: 'BRL',
        paymentMethod: 'pix',
        pix: { expiresInDays: 1 },
        items: items,
        customer: { name: fullName ? fullName.value : '', email: email ? email.value : '', phone: phoneDigits, document: { number: cpfDigits, type: 'cpf' } }
      }
      confirmBtn.disabled = true
      const res = await fetch('http://localhost:8080/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null)
      confirmBtn.disabled = false
      if (!res) { alert('Falha de rede. Tente novamente.') ; return }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { alert(data && (data.error || data.message) ? (data.error || data.message) : 'Falha ao criar pagamento') ; return }
      const amountBRL = amountCents / 100
      if (pixAmountEl) pixAmountEl.textContent = formatCurrencyBRL(amountBRL)
      const code = data && data.pix && data.pix.qrcode ? data.pix.qrcode : ''
      if (pixCode) pixCode.textContent = code
      if (pixQr) pixQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(code)}`
      if (pixInfo) pixInfo.style.display = ''
    })
  }

  history.pushState({ k: 'checkout' }, '')
  window.addEventListener('popstate', () => { window.location.href = 'alerta.html' })
}

if (checkout) { setupCheckout() }

function setupQuiz() {
  const steps = Array.from(document.querySelectorAll('.step'))
  let currentIndex = steps.findIndex(s => !s.hasAttribute('hidden'))
  if (currentIndex < 0) currentIndex = 0
  const watchBtn = document.getElementById('watch-video')
  const checkoutBtn = document.getElementById('go-checkout')
  const videoBox = document.getElementById('video-box')
  const video = document.getElementById('congrats-video')
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => { window.location.href = 'checkout.html' })
  }
  if (watchBtn) {
    watchBtn.addEventListener('click', () => {
      if (videoBox) videoBox.removeAttribute('hidden')
      if (video && typeof video.play === 'function') video.play()
    })
  }
  steps.forEach((step, idx) => {
    const options = Array.from(step.querySelectorAll('.option'))
    const nextBtn = step.querySelector('.next')
    options.forEach(opt => {
      opt.addEventListener('click', () => {
        const isCorrect = opt.dataset.correct === 'true'
        if (isCorrect) {
          options.forEach(o => { if (o !== opt) o.disabled = true })
          opt.classList.add('correct')
          if (nextBtn) nextBtn.disabled = false
        } else {
          opt.classList.add('wrong')
          opt.disabled = true
          if (nextBtn) nextBtn.disabled = true
        }
      })
    })
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        steps[currentIndex].setAttribute('hidden', '')
        currentIndex = Math.min(currentIndex + 1, steps.length - 1)
        const nextStep = steps[currentIndex]
        nextStep.removeAttribute('hidden')
        const final = nextStep.dataset.step === 'done' || currentIndex === steps.length - 1
        if (final) { window.location.href = 'carregamento.html' }
      })
    }
  })
}

if (quiz) { setupQuiz() }

function setupReviewsCarousel() {
  const carousel = document.querySelector('.reviews-carousel')
  if (!carousel) return
  const cards = Array.from(carousel.children)
  const count = cards.length
  if (count === 0) return
  const firstClone = cards[0].cloneNode(true)
  firstClone.setAttribute('aria-hidden','true')
  const lastClone = cards[count - 1].cloneNode(true)
  lastClone.setAttribute('aria-hidden','true')
  carousel.insertBefore(lastClone, carousel.firstChild)
  carousel.appendChild(firstClone)
  const w = () => carousel.clientWidth
  const setIndex = (i, behavior) => carousel.scrollTo({ left: i * w(), behavior: behavior || 'auto' })
  setIndex(1, 'auto')
  let scrollTimer = null
  function checkSentinel() {
    const idx = Math.round(carousel.scrollLeft / w())
    if (idx === 0) setIndex(count, 'auto')
    else if (idx === count + 1) setIndex(1, 'auto')
  }
  function onScroll() {
    clearTimeout(scrollTimer)
    scrollTimer = setTimeout(checkSentinel, 80)
  }
  carousel.addEventListener('scroll', onScroll)
  const interval = 3500
  setInterval(() => {
    checkSentinel()
    carousel.scrollTo({ left: carousel.scrollLeft + w(), behavior: 'smooth' })
    setTimeout(checkSentinel, 420)
  }, interval)
}

setupReviewsCarousel()