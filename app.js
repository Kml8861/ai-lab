class Todo {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    this.list = document.getElementById('todoList');
    this.input = document.getElementById('taskInput');
    this.dateInput = document.getElementById('taskDate');
    this.search = document.getElementById('search');

    this.search.addEventListener('input', () => this.draw(this.search.value));
    document.getElementById('addBtn').addEventListener('click', () => this.addTask());

    this.draw();
  }

  save() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
  }

  addTask() {
    const text = this.input.value.trim();
    const dateValue = this.dateInput.value;

    if (text.length < 3 || text.length > 255) {
      alert('Tekst musi mieć od 3 do 255 znaków.');
      return;
    }

    if (dateValue) {
      const date = new Date(dateValue);
      if (date <= new Date()) {
        alert('Data musi być w przyszłości.');
        return;
      }
    }

    this.tasks.push({
      text: text,
      due: dateValue ? new Date(dateValue).toISOString() : ''
    });

    this.save();
    this.input.value = '';
    this.dateInput.value = '';
    this.draw(this.search.value);
  }

  getFilteredTasks(filter = '') {
    if (!filter || filter.length < 2) return this.tasks;
    return this.tasks.filter(t => t.text.toLowerCase().includes(filter.toLowerCase()));
  }

  highlightTerm(text, term) {
    if (!term || term.length < 2) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  draw(filter = '') {
    this.list.innerHTML = '';
    const visibleTasks = this.getFilteredTasks(filter);

    if (visibleTasks.length === 0) {
      this.list.innerHTML = '<li class="empty">(brak zadań)</li>';
      return;
    }

    visibleTasks.forEach((task, i) => {
      const li = document.createElement('li');
      li.classList.add('task-item');
      li.setAttribute('id', `task-${i}`);

      const textDiv = document.createElement('div');
      textDiv.classList.add('task-content');
      textDiv.innerHTML = this.highlightTerm(task.text, filter);

      li.appendChild(textDiv);

      if (task.due) {
        const dateSpan = document.createElement('span');
        dateSpan.classList.add('task-date');
        dateSpan.setAttribute('data-date', task.due);
        dateSpan.textContent = ` (${new Date(task.due).toLocaleString()})`;
        li.appendChild(dateSpan);
      }

      const del = document.createElement('button');
      del.textContent = 'Usuń';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteTask(i);
      });

      li.appendChild(del);

      li.addEventListener('click', (e) => {
        if (!e.target.closest('button')) this.editTask(i, li, filter);
      });

      this.list.appendChild(li);
    });
  }

  deleteTask(index) {
    this.tasks.splice(index, 1);
    this.save();
    this.draw(this.search.value);
  }

  editTask(index, li, filter) {
    const task = this.tasks[index];
    const originalText = task.text;
    const originalDate = task.due || '';

    li.innerHTML = '';

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.value = originalText;
    textInput.classList.add('edit-input');
    li.appendChild(textInput);

    const dateInput = document.createElement('input');
    dateInput.type = 'datetime-local';
    dateInput.value = originalDate ? new Date(originalDate).toISOString().slice(0, 16) : '';
    dateInput.classList.add('edit-input');
    li.appendChild(dateInput);

    const saveEdit = () => {
      const newText = textInput.value.trim();
      const newDateValue = dateInput.value;

      if (newText.length < 3 || newText.length > 255) {
        alert('Tekst musi mieć od 3 do 255 znaków.');
        this.draw(filter);
        return;
      }

      if (newDateValue) {
        const newDate = new Date(newDateValue);
        if (newDate <= new Date()) {
          alert('Data musi być w przyszłości.');
          this.draw(filter);
          return;
        }
        this.tasks[index].due = newDate.toISOString();
      } else {
        this.tasks[index].due = '';
      }

      this.tasks[index].text = newText;
      this.save();
      this.draw(filter);
    };

    const handleBlur = (e) => {
      // mały timeout zapobiega podwójnemu zapisowi przy przejściu między polami
      setTimeout(() => {
        if (!li.contains(document.activeElement)) saveEdit();
      }, 100);
    };

    textInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveEdit(); });
    dateInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveEdit(); });
    textInput.addEventListener('blur', handleBlur);
    dateInput.addEventListener('blur', handleBlur);

    textInput.focus();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Todo();
});
