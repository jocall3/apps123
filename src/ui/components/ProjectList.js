```javascript
import React from 'react';
import PropTypes from 'prop-types';

/**
 * ProjectList component displays a list of previously generated applications and their statuses.
 * It takes an array of project objects as props.
 */
const ProjectList = ({ projects, onProjectSelect }) => {
  // Basic inline styles for demonstration purposes.
  // In a larger application, consider using CSS Modules, Styled Components, or a UI library.
  const containerStyle = {
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    maxWidth: '900px',
    margin: '20px auto',
    fontFamily: 'Arial, sans-serif',
  };

  const titleStyle = {
    fontSize: '28px',
    color: '#333',
    marginBottom: '25px',
    textAlign: 'center',
    fontWeight: '600',
  };

  const listStyle = {
    listStyleType: 'none',
    padding: '0',
    margin: '0',
  };

  const listItemStyle = {
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    padding: '18px 20px',
    marginBottom: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  };

  const listItemHoverStyle = {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  };

  const projectNameStyle = {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#007bff', // A common link/primary color
  };

  const projectStatusStyle = (status) => {
    let color = '#555';
    let backgroundColor = '#f0f0f0';
    let borderColor = '#ccc';

    switch (status.toLowerCase()) {
      case 'generated':
      case 'success':
        color = '#155724';
        backgroundColor = '#d4edda';
        borderColor = '#c3e6cb';
        break;
      case 'building':
      case 'processing':
        color = '#856404';
        backgroundColor = '#fff3cd';
        borderColor = '#ffeeba';
        break;
      case 'error':
      case 'failed':
        color = '#721c24';
        backgroundColor = '#f8d7da';
        borderColor = '#f5c6cb';
        break;
      default:
        // Default gray for unknown or pending
        color = '#495057';
        backgroundColor = '#e2e6ea';
        borderColor = '#dae0e5';
    }

    return {
      fontSize: '14px',
      fontWeight: '600',
      padding: '6px 10px',
      borderRadius: '4px',
      color: color,
      backgroundColor: backgroundColor,
      border: `1px solid ${borderColor}`,
      minWidth: '90px',
      textAlign: 'center',
    };
  };

  const noProjectsStyle = {
    textAlign: 'center',
    color: '#666',
    fontSize: '18px',
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#e9ecef',
    borderRadius: '6px',
    border: '1px dashed #ced4da',
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Generated Applications</h2>

      {projects && projects.length > 0 ? (
        <ul style={listStyle}>
          {projects.map((project) => (
            <li
              key={project.id}
              style={listItemStyle}
              onClick={() => onProjectSelect && onProjectSelect(project.id)}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, listItemHoverStyle);
              }}
              onMouseLeave={(e) => {
                // Reset to original style but remove hover properties
                Object.assign(e.currentTarget.style, listItemStyle);
                e.currentTarget.style.transform = 'translateY(0)'; // Ensure transform is reset
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; // Ensure shadow is reset
              }}
            >
              <span style={projectNameStyle}>{project.name}</span>
              <span style={projectStatusStyle(project.status)}>{project.status}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p style={noProjectsStyle}>No applications generated yet. Start building your first app!</p>
      )}
    </div>
  );
};

ProjectList.propTypes = {
  /**
   * An array of project objects, each with an id, name, and status.
   */
  projects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired, // e.g., 'Generated', 'Building', 'Error', 'Success'
    })
  ),
  /**
   * Callback function triggered when a project item is clicked.
   * Receives the ID of the clicked project.
   */
  onProjectSelect: PropTypes.func,
};

ProjectList.defaultProps = {
  projects: [],
  onProjectSelect: () => {}, // Provide a no-op default function
};

export default ProjectList;
```