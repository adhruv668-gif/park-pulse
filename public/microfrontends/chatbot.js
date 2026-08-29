/**
 * Park Pulse Chatbot microfrontend.
 * This web component has its own lifecycle, styles, and API read access, so it
 * can be moved to a separate application or embedded in another page later.
 */
class ParkPulseChatbot extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isOpen = false;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: #10213a; }
        * { box-sizing: border-box; }
        .launcher { position: fixed; right: 24px; bottom: 24px; z-index: 30; width: 60px; height: 60px; border: 0; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #06b6d4); color: white; font-size: 25px; cursor: pointer; box-shadow: 0 12px 28px #061a4499; transition: transform .2s; }
        .launcher:hover { transform: translateY(-3px) scale(1.03); }
        .panel { position: fixed; z-index: 31; right: 24px; bottom: 96px; width: min(380px, calc(100vw - 32px)); overflow: hidden; border: 1px solid #dce6f2; border-radius: 20px; background: #fff; box-shadow: 0 22px 55px #02061755; }
        .panel[hidden] { display: none; }
        header { display: flex; align-items: center; gap: 11px; padding: 17px; background: linear-gradient(135deg, #123a85, #2563eb); color: white; }
        .avatar { display: grid; place-items: center; width: 37px; height: 37px; border-radius: 12px; background: #ffffff24; font-size: 19px; }
        h2 { margin: 0; font-size: 15px; } header p { margin: 1px 0 0; color: #dbeafe; font-size: 11px; } .close { margin-left: auto; border: 0; background: transparent; color: white; font-size: 22px; cursor: pointer; }
        .messages { display: flex; flex-direction: column; gap: 10px; height: 285px; overflow-y: auto; padding: 15px; background: #f8fbff; }
        .message { max-width: 85%; padding: 9px 11px; border-radius: 13px; font-size: 13px; line-height: 1.45; white-space: pre-line; }
        .bot { align-self: flex-start; border-bottom-left-radius: 3px; background: white; border: 1px solid #e2eaf5; } .user { align-self: flex-end; border-bottom-right-radius: 3px; background: #2563eb; color: white; }
        .suggestions { display: flex; gap: 7px; overflow-x: auto; padding: 10px 13px 0; background: #f8fbff; } .suggestions button { flex: none; padding: 6px 9px; border: 1px solid #bfdbfe; border-radius: 20px; background: white; color: #1d4ed8; font: 600 11px inherit; cursor: pointer; }
        form { display: flex; gap: 8px; padding: 13px; border-top: 1px solid #e6edf6; } input { min-width: 0; flex: 1; border: 1px solid #cedaea; border-radius: 10px; padding: 10px; color: #10213a; font: 13px inherit; outline: none; } input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px #2563eb1a; } form button { width: 39px; border: 0; border-radius: 10px; background: #2563eb; color: white; font-size: 16px; cursor: pointer; }
        @media (max-width: 520px) { .launcher { right: 16px; bottom: 16px; } .panel { right: 16px; bottom: 86px; } }
      </style>
      <button class="launcher" aria-label="Open Park Pulse assistant" aria-expanded="false">💬</button>
      <section class="panel" aria-label="Park Pulse assistant" hidden>
        <header><span class="avatar">P</span><div><h2>Park Pulse Assistant</h2><p>Online · ready to help</p></div><button class="close" aria-label="Close chat">×</button></header>
        <div class="messages" aria-live="polite"></div>
        <div class="suggestions"><button type="button">Available slots</button><button type="button">Pricing</button><button type="button">How to book</button></div>
        <form><input aria-label="Message Park Pulse Assistant" placeholder="Ask about parking…" maxlength="220" autocomplete="off" /><button aria-label="Send message" type="submit">➤</button></form>
      </section>`;
    this.panel = this.shadowRoot.querySelector('.panel');
    this.messages = this.shadowRoot.querySelector('.messages');
    this.input = this.shadowRoot.querySelector('input');
    this.launcher = this.shadowRoot.querySelector('.launcher');
    this.launcher.addEventListener('click', () => this.toggle());
    this.shadowRoot.querySelector('.close').addEventListener('click', () => this.toggle(false));
    this.shadowRoot.querySelector('form').addEventListener('submit', (event) => this.send(event));
    this.shadowRoot.querySelectorAll('.suggestions button').forEach((button) => button.addEventListener('click', () => this.ask(button.textContent)));
    this.addMessage('Hi! I’m your Park Pulse assistant. Ask me about available slots, pricing, booking, cancelling, or parking history.', 'bot');
  }

  toggle(force) {
    this.isOpen = typeof force === 'boolean' ? force : !this.isOpen;
    this.panel.hidden = !this.isOpen;
    this.launcher.setAttribute('aria-expanded', String(this.isOpen));
    if (this.isOpen) this.input.focus();
  }

  addMessage(text, role) {
    const message = document.createElement('div');
    message.className = `message ${role}`;
    message.textContent = text;
    this.messages.append(message);
    this.messages.scrollTop = this.messages.scrollHeight;
  }

  async ask(question) {
    const text = question.trim();
    if (!text) return;
    this.addMessage(text, 'user');
    this.input.value = '';
    this.addMessage(await this.reply(text.toLowerCase()), 'bot');
  }

  async send(event) { event.preventDefault(); await this.ask(this.input.value); }

  async reply(message) {
    if (/(slot|available|space)/.test(message)) {
      try {
        const response = await fetch('/api/slots');
        const { slots } = await response.json();
        const available = slots.filter((slot) => slot.status === 'available').length;
        return `${available} of ${slots.length} parking spaces are available right now. Register your profile, then select a green slot to reserve it.`;
      } catch { return 'I can’t reach live slot availability right now. Please refresh the page and try again.'; }
    }
    if (/(price|pricing|cost|rate|rupee|₹)/.test(message)) return 'Hourly prices are: Bike ₹25, Scooter ₹30, Car ₹50, and EV ₹60. Your total is calculated from your vehicle type and selected duration.';
    if (/(book|reserve)/.test(message)) return 'First save your parking profile. Next, choose a duration and click a green available slot. Park Pulse will confirm your reservation straight away.';
    if (/(cancel|remove)/.test(message)) return 'Open the Current booking card on the dashboard and choose “Cancel booking”. The parking space will become available again.';
    if (/(history|past|previous)/.test(message)) return 'After saving your profile, use “View history” in Your Dashboard to see your active and previous bookings.';
    if (/(hello|hi|hey)/.test(message)) return 'Hello! What would you like to know about Park Pulse?';
    return 'I can help with slot availability, pricing, booking, cancellation, and parking history. Try asking “How do I book?”';
  }
}

customElements.define('park-pulse-chatbot', ParkPulseChatbot);
