import "../styles/Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <p>© 2026 걷기가 서재. All rights reserved.</p>

      <div className="footer-links">
        <a href="/terms">이용약관</a>
        <a href="/privacy">개인정보처리방침</a>
      </div>
    </footer>
  );
}

export default Footer;
