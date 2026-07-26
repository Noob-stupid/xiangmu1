function bindRadioEvents() {
    const xuanze = document.querySelectorAll('.xuanze');
    xuanze.forEach(item => {
        let ischecked = item.checked;
        item.removeEventListener('click', bindRadioEvents);
        item.addEventListener('click', () => {
            setTimeout(() => {
                if (ischecked == true) {
                    item.checked = false;
                }
                ischecked = item.checked;
            }, 0);
        });
    });
}
bindRadioEvents();