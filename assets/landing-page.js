class CountdownTimer extends HTMLElement {
  constructor() {
    super();
    this.timerElement = this.querySelector('[data-countdown-text]');
    this.targetDateStr = this.dataset.targetDate;
    this.prefix = this.dataset.prefix || '';
    
    if (this.timerElement) {
      this.initTimer();
    }
  }

  initTimer() {
    // If targetDateStr is empty or invalid, fallback to the 1-hour dummy logic from original HTML
    // But since it's customizable, we should try to parse a date
    const targetDate = new Date(this.targetDateStr).getTime();

    // Fallback: Just 1 hour from now for demo purposes if no valid date
    let fallbackSeconds = 3599; // 59:59

    const updateTimer = () => {
      let h, m, s;
      
      if (!isNaN(targetDate) && this.targetDateStr.trim() !== "") {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
          this.timerElement.innerText = `${this.prefix} 00:00:00`;
          return;
        }

        h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        s = Math.floor((distance % (1000 * 60)) / 1000);
      } else {
        // Dummy fallback behavior
        s = fallbackSeconds % 60;
        m = Math.floor((fallbackSeconds / 60) % 60);
        h = Math.floor(fallbackSeconds / 3600);
        fallbackSeconds--;
        if (fallbackSeconds < 0) fallbackSeconds = 0;
      }
      
      const format = (n) => n.toString().padStart(2, '0');
      this.timerElement.innerText = `${this.prefix} ${format(h)}:${format(m)}:${format(s)}`;
    };

    updateTimer();
    setInterval(updateTimer, 1000);
  }
}

customElements.define('countdown-timer', CountdownTimer);
