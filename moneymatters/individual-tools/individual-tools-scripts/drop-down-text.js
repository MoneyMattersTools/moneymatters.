document.getElementById('toggleDropdown').addEventListener('click', function () {
    const content = document.getElementById('dropdownContent');
    const button = document.getElementById('toggleDropdown');
    
    if (content.style.display === 'block') {
      content.style.display = 'none';
      button.classList.remove('open');
    } else {
      content.style.display = 'block';
      button.classList.add('open');
    }
  });
  