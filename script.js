const startBtn = document.getElementById('start-btn')
const checkout = document.getElementById('checkout')
const API_BASE = window.API_BASE || 'https://backend-production-760e.up.railway.app/'
const quiz = document.getElementById('quiz')

if (startBtn) {
  startBtn.addEventListener('click', () => { window.location.href = 'quiz.html' })
}

function formatCurrencyBRL(value) { 
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) 
}

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
  const copyPixBtn = document.getElementById('copy-pix')
  
  const messageDiv = document.createElement('div')
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #2ecc71;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    display: none;
    max-width: 300px;
  `
  document.body.appendChild(messageDiv)
  
  function showMessage(text, isError = false) {
    messageDiv.textContent = text
    messageDiv.style.background = isError ? '#e74c3c' : '#2ecc71'
    messageDiv.style.display = 'block'
    setTimeout(() => {
      messageDiv.style.display = 'none'
    }, 4000)
  }
  
  let shipping = 0
  let selectedShippingCode = null
  let cepOk = false
  let extrasCount = 0
  const extrasUnit = 24.99
  let brindeModel = 'camisa1'
  const subtotal = 0

  function updateTotals() {
    const extras = extrasCount * extrasUnit
    const total = subtotal + shipping + extras
    if (subtotalEl) subtotalEl.textContent = formatCurrencyBRL(subtotal)
    if (shippingEl) shippingEl.textContent = formatCurrencyBRL(shipping)
    if (extrasEl) extrasEl.textContent = formatCurrencyBRL(extras)
    if (extrasLine) extrasLine.style.display = extras > 0 ? '' : 'none'
    if (shippingLine) shippingLine.style.display = shipping > 0 ? '' : 'none'
    if (totalEl) totalEl.textContent = formatCurrencyBRL(total)
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
    return allOk
  }

  shippingCards.forEach(c => {
    c.addEventListener('click', () => {
      if (!cepOk) {
        showMessage('⚠️ Informe o CEP primeiro', true)
        return
      }
      shippingCards.forEach(x => x.classList.remove('active'))
      c.classList.add('active')
      const price = parseFloat(c.dataset.price || '0')
      shipping = isNaN(price) ? 0 : price
      selectedShippingCode = c.dataset.code || null
      updateTotals()
      validateCheckout()
    })
  })

  const countdownEl = document.getElementById('countdown')
  let remaining = 10 * 60
  function tick() {
    const m = String(Math.floor(remaining / 60)).padStart(2,'0')
    const s = String(remaining % 60).padStart(2,'0')
    if (countdownEl) countdownEl.textContent = `00:${m}:${s}`
    remaining -= 1
    if (remaining < 0) { 
      showMessage('⏰ Tempo esgotado! Kit devolvido ao estoque.', true)
      setTimeout(() => {
        window.location.href = 'index.html'
      }, 2000)
      return 
    }
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
    if (orderBump) { 
      orderBump.style.display = ''; 
      orderBump.classList.add('reveal') 
    }
  }

  function hideShippingSection() {
    if (!shippingSection) return
    shippingSection.style.display = 'none'
    shippingSection.classList.remove('reveal')
    if (orderBump) { 
      orderBump.style.display = 'none'; 
      orderBump.classList.remove('reveal') 
    }
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
    if (digits.length === 8) {
      fetchViaCep(digits)
    } else {
      clearAddressFields()
      hideShippingSection()
      if (cepError) cepError.textContent = digits.length > 0 ? 'CEP deve ter 8 dígitos' : ''
      if (cepInput) cepInput.classList.toggle('invalid', digits.length > 0 && digits.length !== 8)
      cepOk = false
      validateCheckout()
    }
  }

  if (cepInput) cepInput.addEventListener('input', onCepInput)

  if (payCard) {
    payCard.classList.add('active')
    payCard.setAttribute('aria-checked', 'true')
    const radio = payCard.querySelector('.method-radio')
    if (radio) radio.checked = true
  }

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
      shirtCards.forEach(x => { 
        x.classList.remove('active'); 
        x.setAttribute('aria-checked', 'false') 
      })
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

  if (copyPixBtn) {
    copyPixBtn.addEventListener('click', () => {
      if (pixCode && pixCode.textContent) {
        navigator.clipboard.writeText(pixCode.textContent)
          .then(() => {
            const originalText = copyPixBtn.textContent
            copyPixBtn.textContent = '✅ Código copiado!'
            setTimeout(() => {
              copyPixBtn.textContent = originalText
            }, 3000)
          })
          .catch(() => {
            showMessage('❌ Erro ao copiar código', true)
          })
      }
    })
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (!validateCheckout()) {
        showMessage('⚠️ Preencha todos os campos corretamente', true)
        return
      }
      if (confirmBtn.disabled) return

      const shippingCode = selectedShippingCode || 'correios'
      const shippingCents = shippingCode === 'jadlog' ? 3499 : 3799
      const extrasCents = Math.round(extrasCount * 24.99 * 100)
      const amountCents = shippingCents + extrasCents

      const phoneDigits = onlyDigits(phone ? phone.value : '')
      const cpfDigits = onlyDigits(cpf ? cpf.value : '')

      const items = [
        { 
          title: 'Kit Natalino Sadia x Bauducco', 
          unitPrice: 0,
          quantity: 1, 
          tangible: true, 
          externalRef: 'kit_natal_gratis' 
        },
        { 
          title: shippingCode === 'jadlog' ? 'Frete Jadlog' : 'Frete Correios', 
          unitPrice: shippingCents, 
          quantity: 1, 
          tangible: false, 
          externalRef: shippingCode 
        }
      ]

      items.push({ 
        title: `Camiseta G (${brindeModel}) - Brinde`, 
        unitPrice: 0,
        quantity: 1, 
        tangible: true, 
        externalRef: 'camisa_brinde' 
      })

      if (extrasCents > 0 && extrasCount > 0) {
        items.push({ 
          title: 'Camiseta adicional G', 
          unitPrice: 2499,
          quantity: extrasCount, 
          tangible: true, 
          external_ref: 'camisa_extra' 
        })
      }

      const body = {
        amount: amountCents,
        currency: 'BRL',
        paymentMethod: 'pix',
        pix: { expiresInDays: 1 },
        items: items,
        customer: { 
          name: fullName ? fullName.value.trim() : '', 
          email: email ? email.value.trim() : '', 
          phone: phoneDigits, 
          document: { number: cpfDigits, type: 'cpf' } 
        }
      }

      const loadingMessages = [
        "🎄 Processando seu Natal...",
        "📦 Confirmando estoque...", 
        "🚚 Calculando frete...",
        "💰 Gerando PIX...",
        "⏳ Quase lá...",
        "🎁 Preparando seus brindes...",
        "🔥 Muitos pedidos, aguarde...",
        "✅ Finalizando..."
      ]
      
      let messageIndex = 0
      const loadingInterval = setInterval(() => {
        confirmBtn.textContent = loadingMessages[messageIndex]
        messageIndex = (messageIndex + 1) % loadingMessages.length
      }, 1800)
      
      confirmBtn.disabled = true
      confirmBtn.textContent = loadingMessages[0]

      try {
        const res = await fetch(`${API_BASE}api/transactions`, {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(body)
        })

        clearInterval(loadingInterval)

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          const errorMsg = errorData.message || 'Sistema temporariamente indisponível'
          throw new Error(errorMsg)
        }

        const data = await res.json()
        const amountBRL = amountCents / 100
        if (pixAmountEl) pixAmountEl.textContent = formatCurrencyBRL(amountBRL)
        const code = data.pix?.qrcode || ''
        if (pixCode) pixCode.textContent = code
        if (pixQr) {
          pixQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(code)}`
        }
        
        if (pixInfo) {
          pixInfo.style.display = ''
          pixInfo.scrollIntoView({ behavior: 'smooth' })
          showMessage('🎉 PIX gerado com sucesso! Escaneie o QR Code.')
        }
      } catch (error) {
        clearInterval(loadingInterval)
        console.error('Erro no pagamento:', error)
        const errorMessages = [
          '❌ Sistema ocupado no momento',
          '⚠️ Tente novamente em instantes', 
          '🔧 Estamos com muitos pedidos',
          '💸 Problema temporário no pagamento'
        ]
        const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)]
        showMessage(randomError, true)
      } finally {
        confirmBtn.disabled = false
        confirmBtn.textContent = 'Pagar e confirmar envio'
      }
    })
  }

  history.pushState({ k: 'checkout' }, '')
  window.addEventListener('popstate', () => { 
    window.location.href = 'alerta.html' 
  })

  updateTotals()
  validateCheckout()
}

if (checkout) { 
  document.addEventListener('DOMContentLoaded', setupCheckout) 
}

function setupQuiz() {
  const steps = Array.from(document.querySelectorAll('.step'))
  let currentIndex = steps.findIndex(s => !s.hasAttribute('hidden'))
  if (currentIndex < 0) currentIndex = 0
  const checkoutBtn = document.getElementById('go-checkout')
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => { window.location.href = 'https://sadiaxbauducco.store/checkout.html' })
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
        if (final) { window.location.href = 'https://sadiaxbauducco.store/checkout.html' }
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
